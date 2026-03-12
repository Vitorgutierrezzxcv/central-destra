import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function getValidAccessToken(base44, profile) {
  const expiry = profile.google_calendar_token_expiry ? new Date(profile.google_calendar_token_expiry) : null;
  const isExpired = !expiry || expiry <= new Date(Date.now() + 60 * 1000);

  if (!isExpired) return profile.google_calendar_access_token;

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: profile.google_calendar_refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to refresh token');

  await base44.asServiceRole.entities.UserProfile.update(profile.id, {
    google_calendar_access_token: data.access_token,
    google_calendar_token_expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  });

  return data.access_token;
}

async function upsertCalendarEvent(accessToken, task, existingEventId) {
  // Use end_date or start_date; Google all-day events need date + 1 day as end
  const dateStr = task.end_date || task.start_date;
  if (!dateStr) return null;

  // For all-day events, end must be the next day
  const endDate = new Date(dateStr);
  endDate.setDate(endDate.getDate() + 1);
  const endDateStr = endDate.toISOString().split('T')[0];

  const eventBody = {
    summary: `📋 ${task.title}`,
    description: task.description || '',
    start: { date: dateStr },
    end: { date: endDateStr },
  };

  let res;
  if (existingEventId) {
    // Update existing event
    res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEventId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody),
      }
    );
  } else {
    // Create new event
    res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody),
      }
    );
  }

  const data = await res.json();
  if (!res.ok) {
    // If event not found on update, create new
    if (res.status === 404 && existingEventId) {
      return upsertCalendarEvent(accessToken, task, null);
    }
    throw new Error(data.error?.message || 'Calendar API error');
  }
  return data.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Allow both authenticated user calls and service-role automation calls
    const body = await req.json().catch(() => ({}));

    // Can be called with a specific task_id (automation) or bulk (no task_id)
    const { task_id, event, data: taskData } = body;

    let tasksToSync = [];

    if (task_id && taskData) {
      // Called from automation with event payload
      const task = taskData;
      if (task.assigned_to && (task.end_date || task.start_date)) {
        tasksToSync = [task];
      }
    } else if (!task_id) {
      // Bulk sync — called manually, requires admin
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const allTasks = await base44.asServiceRole.entities.Task.list();
      tasksToSync = allTasks.filter(t => t.assigned_to && (t.end_date || t.start_date));
    } else {
      return Response.json({ synced: 0 });
    }

    let synced = 0;
    const errors = [];

    for (const task of tasksToSync) {
      try {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: task.assigned_to });
        const profile = profiles[0];
        if (!profile?.google_calendar_connected || !profile?.google_calendar_refresh_token) continue;

        const accessToken = await getValidAccessToken(base44, profile);
        const eventId = await upsertCalendarEvent(accessToken, task, task.gcal_event_id || null);

        if (eventId && eventId !== task.gcal_event_id) {
          await base44.asServiceRole.entities.Task.update(task.id, { gcal_event_id: eventId });
        }
        synced++;
      } catch (err) {
        errors.push({ task_id: task.id, error: err.message });
      }
    }

    return Response.json({ synced, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});