import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Failed to refresh token');
  return {
    access_token: data.access_token,
    expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get the user's personal tokens from their UserProfile
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    const profile = profiles[0];

    if (!profile?.google_calendar_connected || !profile?.google_calendar_refresh_token) {
      return Response.json({ connected: false, events: [] });
    }

    let accessToken = profile.google_calendar_access_token;
    const expiry = profile.google_calendar_token_expiry ? new Date(profile.google_calendar_token_expiry) : null;
    const isExpired = !expiry || expiry <= new Date(Date.now() + 60 * 1000);

    // Refresh token if expired
    if (isExpired) {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      const refreshed = await refreshAccessToken(clientId, clientSecret, profile.google_calendar_refresh_token);
      accessToken = refreshed.access_token;
      // Update stored token
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        google_calendar_access_token: refreshed.access_token,
        google_calendar_token_expiry: refreshed.expiry,
      });
    }

    const body = await req.json().catch(() => ({}));
    const year = body.year ?? new Date().getFullYear();
    const month = body.month ?? new Date().getMonth();

    const timeMin = new Date(year, month, 1).toISOString();
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    // Fetch all calendars
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const calListData = await calListRes.json();
    const calendars = (calListData.items || []).filter(c => c.accessRole !== 'none');

    // Fetch events from all calendars in parallel
    const allEventFetches = calendars.map(async (cal) => {
      const calId = encodeURIComponent(cal.id);
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      return (data.items || []).map(e => ({ ...e, calendarColor: cal.backgroundColor }));
    });

    const results = await Promise.all(allEventFetches);
    const events = results.flat();

    return Response.json({ connected: true, events });
  } catch (error) {
    return Response.json({ connected: false, events: [], error: error.message });
  }
});