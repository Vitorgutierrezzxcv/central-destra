import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");

    const body = await req.json().catch(() => ({}));
    const year = body.year ?? new Date().getFullYear();
    const month = body.month ?? new Date().getMonth(); // 0-indexed

    const timeMin = new Date(year, month, 1).toISOString();
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    // 1. Fetch all calendars the user has access to
    const calListRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const calListData = await calListRes.json();
    const calendars = (calListData.items || []).filter(c => c.accessRole !== 'none');

    // 2. Fetch events from all calendars in parallel
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