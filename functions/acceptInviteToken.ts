import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { token } = await req.json();

  if (!token) return Response.json({ error: 'Token required' }, { status: 400 });

  const invites = await base44.asServiceRole.entities.ClientInvite.filter({ invite_token: token });
  const invite = invites[0];

  if (!invite || invite.invite_status !== 'sent') {
    return Response.json({ error: 'Convite inválido ou já utilizado' }, { status: 400 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    await base44.asServiceRole.entities.ClientInvite.update(invite.id, { invite_status: 'expired' });
    return Response.json({ error: 'Convite expirado' }, { status: 400 });
  }

  // Marcar convite como aceito
  await base44.asServiceRole.entities.ClientInvite.update(invite.id, {
    invite_status: 'accepted',
    accepted_at: new Date().toISOString()
  });

  // Ativar ClientContact
  await base44.asServiceRole.entities.ClientContact.update(invite.client_contact_id, {
    status: 'active',
    activated_at: new Date().toISOString()
  });

  // Criar/atualizar UserProfile
  const existingProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: invite.email });
  if (existingProfiles.length === 0) {
    const contacts = await base44.asServiceRole.entities.ClientContact.filter({ id: invite.client_contact_id });
    const contact = contacts[0];
    await base44.asServiceRole.entities.UserProfile.create({
      user_email: invite.email,
      display_name: contact?.name || '',
      full_name: contact?.name || '',
      portal_type: 'client',
      linked_company_id: invite.company_id,
      linked_client_contact_id: invite.client_contact_id
    });
  } else {
    await base44.asServiceRole.entities.UserProfile.update(existingProfiles[0].id, {
      portal_type: 'client',
      linked_company_id: invite.company_id,
      linked_client_contact_id: invite.client_contact_id
    });
  }

  return Response.json({ success: true });
});