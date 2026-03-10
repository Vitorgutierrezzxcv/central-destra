import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { client_contact_id } = await req.json();

  const contacts = await base44.asServiceRole.entities.ClientContact.filter({ id: client_contact_id });
  const contact = contacts[0];
  if (!contact) return Response.json({ error: 'Contato não encontrado' }, { status: 404 });

  const companies = contact.company_id
    ? await base44.asServiceRole.entities.Company.filter({ id: contact.company_id })
    : [];
  const company = companies[0];

  const accesses = await base44.asServiceRole.entities.ProjectClientAccess.filter({
    client_contact_id: contact.id,
    is_active: true
  });
  let project = null;
  if (accesses.length > 0) {
    const projs = await base44.asServiceRole.entities.Project.filter({ id: accesses[0].project_id });
    project = projs[0];
  }

  // Cancelar/superseder convites anteriores ativos
  const oldInvites = await base44.asServiceRole.entities.ClientInvite.filter({
    client_contact_id: contact.id
  });
  for (const inv of oldInvites) {
    if (['sent', 'pending'].includes(inv.invite_status)) {
      await base44.asServiceRole.entities.ClientInvite.update(inv.id, {
        invite_status: 'superseded',
        cancelled_at: new Date().toISOString()
      });
    }
  }

  // Gerar token único
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Criar registro do convite
  const invite = await base44.asServiceRole.entities.ClientInvite.create({
    client_contact_id: contact.id,
    email: contact.email,
    company_id: contact.company_id || '',
    project_id: accesses[0]?.project_id || '',
    invite_token: token,
    invite_status: 'sent',
    sent_at: new Date().toISOString(),
    expires_at: expiresAt,
    invited_by: user.email
  });

  // Atualizar status do contato
  await base44.asServiceRole.entities.ClientContact.update(contact.id, {
    invited_at: new Date().toISOString()
  });

  // Montar link de ativação
  const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || '';
  const activationLink = `${origin}/ClientPortalActivate?token=${token}`;

  // Enviar e-mail real
  await base44.asServiceRole.integrations.Core.SendEmail({
    to: contact.email,
    from_name: 'Destra — Portal do Cliente',
    subject: `${contact.name}, seu acesso ao Portal Destra está pronto`,
    body: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portal Destra</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:36px 40px 32px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:#3b82f6;border-radius:10px;width:40px;height:40px;text-align:center;vertical-align:middle;">
        <span style="color:white;font-size:18px;font-weight:700;">D</span>
      </td>
      <td style="padding-left:12px;vertical-align:middle;">
        <p style="margin:0;color:white;font-size:13px;font-weight:700;letter-spacing:2px;">DESTRA</p>
        <p style="margin:0;color:#94a3b8;font-size:10px;letter-spacing:1px;">PORTAL DO CLIENTE</p>
      </td>
    </tr></table>
    <h1 style="color:white;font-size:22px;font-weight:700;margin:24px 0 6px;">Seu acesso foi liberado! 🎉</h1>
    <p style="color:#94a3b8;font-size:13px;margin:0;">Você tem um espaço exclusivo para acompanhar seu projeto</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:36px 40px;">
    <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Olá, <strong>${contact.name}</strong> 👋</p>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 28px;">
      A equipe <strong>Destra</strong> preparou um portal exclusivo para que você acompanhe o progresso do seu projeto em tempo real — visualize entregas, aprove etapas, acesse documentos e muito mais.
    </p>
    ${company || project ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
      ${company ? `<tr><td style="padding:14px 20px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Empresa</span><br>
        <span style="font-size:14px;color:#1e293b;font-weight:600;">${company.name}</span>
      </td></tr>` : ''}
      ${project ? `<tr><td style="padding:14px 20px;">
        <span style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Projeto</span><br>
        <span style="font-size:14px;color:#1e293b;font-weight:600;">${project.name}</span>
      </td></tr>` : ''}
    </table>` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center">
        <a href="${activationLink}" style="display:inline-block;background:#3b82f6;color:white;text-decoration:none;padding:16px 44px;border-radius:12px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
          Acessar o Portal →
        </a>
      </td></tr>
    </table>
    <p style="text-align:center;font-size:12px;color:#94a3b8;margin:0 0 8px;">⏱ Este link é válido por <strong>7 dias</strong></p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;">
    <p style="font-size:11px;color:#94a3b8;margin:0 0 8px;">Se o botão não funcionar, acesse diretamente:</p>
    <p style="font-size:11px;color:#3b82f6;word-break:break-all;margin:0 0 16px;">${activationLink}</p>
    <p style="font-size:11px;color:#94a3b8;margin:0;">Dúvidas? Entre em contato com seu gestor de conta na Destra.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
  });

  return Response.json({ success: true, invite_id: invite.id, token });
});