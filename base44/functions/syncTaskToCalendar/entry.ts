import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with Google Calendar token
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    const userProfile = profiles[0];

    if (!userProfile?.google_calendar_connected || !userProfile?.google_calendar_access_token) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Get all tasks assigned to the user
    const allTasks = await base44.asServiceRole.entities.Task.list();
    const userTasks = allTasks.filter(t => t.assigned_to === user.email && (t.start_date || t.end_date));

    let synced = 0;

    // Sync each task to Google Calendar
    for (const task of userTasks) {
      if (!task.gcal_event_id) {
        try {
          // Create calendar event
          const eventData = {
            summary: task.title,
            description: task.description || '',
            start: {
              date: task.start_date || task.end_date
            },
            end: {
              date: task.end_date || task.start_date
            }
          };

          const calendarRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userProfile.google_calendar_access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
          });

          if (calendarRes.ok) {
            const event = await calendarRes.json();
            
            // Update task with calendar event ID
            await base44.asServiceRole.entities.Task.update(task.id, {
              gcal_event_id: event.id
            });

            synced++;
          }
        } catch (e) {
          console.error(`Error syncing task ${task.id}:`, e);
        }
      }
    }

    return Response.json({ synced, total: userTasks.length });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});