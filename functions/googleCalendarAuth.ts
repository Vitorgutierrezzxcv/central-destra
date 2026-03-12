import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { redirect_origin } = await req.json().catch(() => ({}));
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const redirectUri = `${redirect_origin}/GoogleCalendarCallback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.readonly openid email',
      access_type: 'offline',
      prompt: 'consent',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    return Response.json({ authUrl, redirectUri });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});