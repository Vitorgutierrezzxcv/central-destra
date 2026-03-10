import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { invite_id } = await req.json();
  if (!invite_id) return Response.json({ error: 'invite_id obrigatório' }, { status: 400 });

  const invites = await base44.asServiceRole.entities.ClientInvite.filter({ id: invite_id });
  const invite = invites[0];
  if (!invite) return Response.json({ error: 'Convite não encontrado' }, { status: 404 });

  await base44.asServiceRole.entities.ClientInvite.update(invite_id, {
    invite_status: 'cancelled',
    cancelled_at: new Date().toISOString()
  });

  return Response.json({ success: true });
});