import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;
    if (!data) return Response.json({ ok: true, skipped: "no data" });

    const delivery = data;

    // Only notify on newly delivered items
    if (!["delivered", "under_review"].includes(delivery.status)) {
      return Response.json({ ok: true, skipped: "status not delivered" });
    }

    const project = delivery.project_id
      ? await base44.asServiceRole.entities.Project.filter({ id: delivery.project_id }).then(d => d?.[0])
      : null;

    if (!project?.client_portal_enabled || !project?.company_id) {
      return Response.json({ ok: true, skipped: "portal not enabled or no company" });
    }

    // Create notification for client
    await base44.asServiceRole.entities.Notification.create({
      title: "Nova entrega disponível para aprovação",
      message: `A entrega "${delivery.title}" foi disponibilizada para sua revisão no projeto "${project.name}". Por favor, acesse o portal para aprovar ou solicitar ajustes.`,
      type: "new_delivery",
      read: false,
      link: `/ClientPortalDeliveries`,
      company_id: project.company_id
    });

    // Send email notification if there's a primary contact
    const company = await base44.asServiceRole.entities.Company.filter({ id: project.company_id }).then(d => d?.[0]);
    if (company?.primary_client_contact) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: company.primary_client_contact,
        subject: `Nova entrega disponível: ${delivery.title}`,
        body: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0B0F1A; color: #fff; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #2563eb, #1e40af); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 24px;">📦</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #fff;">Nova Entrega Disponível</h1>
            </div>
            <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
              Olá! A equipe Destra disponibilizou uma nova entrega no seu portal para revisão e aprovação.
            </p>
            <div style="background: #0D1221; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Entrega</p>
              <p style="margin: 0; color: #fff; font-size: 16px; font-weight: 600;">${delivery.title}</p>
              ${project ? `<p style="margin: 8px 0 0; color: #64748b; font-size: 13px;">Projeto: ${project.name}</p>` : ''}
              ${delivery.description ? `<p style="margin: 12px 0 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">${delivery.description}</p>` : ''}
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="${Deno.env.get('APP_URL') || 'https://app.base44.com'}/ClientPortalDeliveries" 
                 style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600;">
                Ver e Aprovar Entrega →
              </a>
            </div>
            <p style="text-align: center; color: #475569; font-size: 12px; margin-top: 32px;">
              © ${new Date().getFullYear()} Destra · Portal do Cliente
            </p>
          </div>
        `
      });
    }

    return Response.json({ ok: true, notified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});