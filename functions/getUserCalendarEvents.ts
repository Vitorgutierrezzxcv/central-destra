import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    const profile = profiles[0];

    if (!profile?.google_calendar_connected || !profile?.google_calendar_access_token) {
      return Response.json({ connected: false, events: [] });
    }

    let accessToken = profile.google_calendar_access_token;

    // Refresh token if expired
    if (profile.google_calendar_token_expiry && new Date(profile.google_calendar_token_expiry) < new Date(Date.now() + 60000)) {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: profile.google_calendar_refresh_token,
          grant_type: 'refresh_token',
        }),
      });
      const refreshData = await refreshRes.json();
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
        const expiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          google_calendar_access_token: accessToken,
          google_calendar_token_expiry: expiry,
        });
      }
    }

    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    const eventsRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const eventsData = await eventsRes.json();
    return Response.json({ connected: true, events: eventsData.items || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});