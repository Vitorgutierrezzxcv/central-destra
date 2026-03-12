import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { code, redirect_uri } = await req.json();
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return Response.json({ error: tokenData.error_description || 'Token exchange failed' }, { status: 400 });

    const expiry = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Save tokens to UserProfile
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    const profileData = {
      google_calendar_access_token: tokenData.access_token,
      google_calendar_refresh_token: tokenData.refresh_token,
      google_calendar_token_expiry: expiry,
      google_calendar_connected: true,
    };

    if (profiles.length > 0) {
      await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, profileData);
    } else {
      await base44.asServiceRole.entities.UserProfile.create({ user_email: user.email, ...profileData });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});