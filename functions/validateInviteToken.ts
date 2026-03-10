import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { token } = await req.json();

  if (!token) return Response.json({ valid: false, reason: 'no_token' });

  const invites = await base44.asServiceRole.entities.ClientInvite.filter({ invite_token: token });
  const invite = invites[0];

  if (!invite) return Response.json({ valid: false, reason: 'invalid' });
  if (invite.invite_status === 'accepted') return Response.json({ valid: false, reason: 'already_used' });
  if (invite.invite_status === 'cancelled') return Response.json({ valid: false, reason: 'cancelled' });

  if (new Date(invite.expires_at) < new Date()) {
    await base44.asServiceRole.entities.ClientInvite.update(invite.id, { invite_status: 'expired' });
    return Response.json({ valid: false, reason: 'expired' });
  }

  const contacts = await base44.asServiceRole.entities.ClientContact.filter({ id: invite.client_contact_id });
  const contact = contacts[0];

  const companies = invite.company_id
    ? await base44.asServiceRole.entities.Company.filter({ id: invite.company_id })
    : [];

  const projects = invite.project_id
    ? await base44.asServiceRole.entities.Project.filter({ id: invite.project_id })
    : [];

  return Response.json({
    valid: true,
    invite_id: invite.id,
    contact: contact ? { name: contact.name, email: contact.email } : null,
    company: companies[0] ? { name: companies[0].name, logo_url: companies[0].logo_url } : null,
    project: projects[0] ? { name: projects[0].name } : null
  });
});