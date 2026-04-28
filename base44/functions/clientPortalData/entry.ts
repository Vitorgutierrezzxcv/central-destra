/**
 * Função pública para buscar dados do Portal do Cliente.
 * Usa asServiceRole para acessar entidades sem exigir auth Base44.
 * Valida a sessão via portal_session_token antes de retornar dados.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, token, params = {} } = body;

    if (!token) {
      return Response.json({ error: "Token de sessão obrigatório." }, { status: 401 });
    }

    // Valida sessão
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ portal_session_token: token });
    const profile = profiles?.[0];
    if (!profile) return Response.json({ error: "Sessão inválida." }, { status: 401 });

    const expired = profile.portal_session_expires && new Date(profile.portal_session_expires) < new Date();
    if (expired) return Response.json({ error: "Sessão expirada." }, { status: 401 });

    const userEmail = profile.user_email;

    // Resolve ClientContact
    const contacts = await base44.asServiceRole.entities.ClientContact.filter({ email: userEmail });
    const contact = contacts?.[0] || null;
    const contactId = contact?.id || profile.linked_client_contact_id || null;
    const companyId = contact?.company_id || profile.linked_company_id || null;

    if (action === "session_info") {
      return Response.json({
        profile: {
          id: profile.id,
          email: userEmail,
          name: profile.full_name || profile.display_name || userEmail,
          linked_company_id: companyId,
          linked_client_contact_id: contactId,
          portal_type: profile.portal_type || "client"
        },
        contactId,
        companyId
      });
    }

    if (action === "get_projects") {
      // Busca acessos explícitos
      let projectAccess = [];
      if (contactId) {
        projectAccess = await base44.asServiceRole.entities.ProjectClientAccess.filter({ client_contact_id: contactId });
      }

      const authorizedIds = projectAccess.filter(pa => pa.is_active !== false).map(pa => pa.project_id);

      // Busca projetos
      const allProjects = await base44.asServiceRole.entities.Project.list();

      let projects;
      if (authorizedIds.length > 0) {
        projects = allProjects.filter(p => authorizedIds.includes(p.id));
      } else if (companyId) {
        projects = allProjects.filter(p => p.company_id === companyId && p.client_portal_enabled);
      } else {
        projects = [];
      }

      // Busca empresa
      let company = null;
      if (companyId) {
        const companies = await base44.asServiceRole.entities.Company.filter({ id: companyId });
        company = companies?.[0] || null;
      }

      return Response.json({ projects, projectAccess, company, contactId, companyId });
    }

    if (action === "get_tasks") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });

      const tasks = await base44.asServiceRole.entities.Task.filter({ project_id, visible_to_client: true });
      return Response.json({ tasks });
    }

    if (action === "get_deliveries") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });

      const deliveries = await base44.asServiceRole.entities.TaskDelivery.filter({ project_id });
      return Response.json({ deliveries });
    }

    if (action === "get_milestones") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });

      const milestones = await base44.asServiceRole.entities.ProjectMilestone.filter({ project_id });
      return Response.json({ milestones });
    }

    if (action === "get_meetings") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });

      const meetings = await base44.asServiceRole.entities.ProjectMeeting.filter({ project_id });
      return Response.json({ meetings });
    }

    if (action === "get_files") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });

      const files = await base44.asServiceRole.entities.ProjectFile.filter({ project_id });
      return Response.json({ files });
    }

    if (action === "get_onboarding") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });

      const items = await base44.asServiceRole.entities.OnboardingItem.filter({ project_id });
      return Response.json({ items });
    }

    if (action === "get_timeline") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });

      const events = await base44.asServiceRole.entities.ProjectTimelineEvent.filter({ project_id });
      return Response.json({ events });
    }

    if (action === "get_tickets") {
      const { project_id } = params;
      const filterBy = project_id ? { project_id } : { company_id: companyId };
      const tickets = await base44.asServiceRole.entities.SupportTicket.filter(filterBy);
      return Response.json({ tickets });
    }

    if (action === "get_invoices") {
      const invoices = await base44.asServiceRole.entities.ClientInvoice.filter({ company_id: companyId });
      const contracts = await base44.asServiceRole.entities.ClientContract.filter({ company_id: companyId });
      return Response.json({ invoices, contracts });
    }

    if (action === "get_contact") {
      if (!contactId) return Response.json({ contact: null });
      const contacts = await base44.asServiceRole.entities.ClientContact.filter({ id: contactId });
      return Response.json({ contact: contacts?.[0] || null });
    }

    if (action === "update_contact") {
      const { phone, address } = params;
      if (!contactId) return Response.json({ error: "Contato não encontrado." }, { status: 404 });
      const updated = await base44.asServiceRole.entities.ClientContact.update(contactId, { phone, address });
      return Response.json({ contact: updated });
    }

    if (action === "get_satisfaction") {
      const surveys = await base44.asServiceRole.entities.SatisfactionSurvey.filter({ company_id: companyId });
      return Response.json({ surveys });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});