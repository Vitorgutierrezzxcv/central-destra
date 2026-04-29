/**
 * Dados do Portal do Cliente.
 * Usa createClient com appId diretamente (sem asServiceRole, sem auth de usuário Base44).
 */
import { createClient } from 'npm:@base44/sdk@0.8.25';

const APP_ID = Deno.env.get("BASE44_APP_ID");

function getDb() {
  return createClient({ appId: APP_ID, requiresAuth: false });
}

Deno.serve(async (req) => {
  try {
    const db = getDb();
    const body = await req.json();
    const { action, token, params = {} } = body;

    if (!token) {
      return Response.json({ error: "Token de sessão obrigatório." }, { status: 401 });
    }

    const profiles = await db.entities.UserProfile.filter({ portal_session_token: token });
    const profile = profiles?.[0];
    if (!profile) return Response.json({ error: "Sessão inválida." }, { status: 401 });

    const expired = profile.portal_session_expires && new Date(profile.portal_session_expires) < new Date();
    if (expired) return Response.json({ error: "Sessão expirada." }, { status: 401 });

    const userEmail = profile.user_email;
    const contacts = await db.entities.ClientContact.filter({ email: userEmail });
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
      let projectAccess = [];
      if (contactId) {
        projectAccess = await db.entities.ProjectClientAccess.filter({ client_contact_id: contactId }) || [];
      }
      const authorizedIds = projectAccess.filter(pa => pa.is_active !== false).map(pa => pa.project_id);
      const allProjects = await db.entities.Project.list() || [];

      let projects;
      if (authorizedIds.length > 0) {
        projects = allProjects.filter(p => authorizedIds.includes(p.id));
      } else if (companyId) {
        projects = allProjects.filter(p => p.company_id === companyId && p.client_portal_enabled);
      } else {
        projects = [];
      }

      let company = null;
      if (companyId) {
        const companies = await db.entities.Company.filter({ id: companyId });
        company = companies?.[0] || null;
      }

      return Response.json({ projects, projectAccess, company, contactId, companyId });
    }

    if (action === "get_tasks") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });
      const tasks = await db.entities.Task.filter({ project_id, visible_to_client: true });
      return Response.json({ tasks: tasks || [] });
    }

    if (action === "get_deliveries") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });
      const deliveries = await db.entities.TaskDelivery.filter({ project_id });
      return Response.json({ deliveries: deliveries || [] });
    }

    if (action === "get_milestones") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });
      const milestones = await db.entities.ProjectMilestone.filter({ project_id });
      return Response.json({ milestones: milestones || [] });
    }

    if (action === "get_meetings") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });
      const meetings = await db.entities.ProjectMeeting.filter({ project_id });
      return Response.json({ meetings: meetings || [] });
    }

    if (action === "get_files") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });
      const files = await db.entities.ProjectFile.filter({ project_id });
      return Response.json({ files: files || [] });
    }

    if (action === "get_onboarding") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });
      const items = await db.entities.OnboardingItem.filter({ project_id });
      return Response.json({ items: items || [] });
    }

    if (action === "get_timeline") {
      const { project_id } = params;
      if (!project_id) return Response.json({ error: "project_id obrigatório." }, { status: 400 });
      const events = await db.entities.ProjectTimelineEvent.filter({ project_id });
      return Response.json({ events: events || [] });
    }

    if (action === "get_tickets") {
      const { project_id } = params;
      const filterBy = project_id ? { project_id } : { company_id: companyId };
      const tickets = await db.entities.SupportTicket.filter(filterBy);
      return Response.json({ tickets: tickets || [] });
    }

    if (action === "get_invoices") {
      const [invoices, contracts] = await Promise.all([
        db.entities.ClientInvoice.filter({ company_id: companyId }),
        db.entities.ClientContract.filter({ company_id: companyId })
      ]);
      return Response.json({ invoices: invoices || [], contracts: contracts || [] });
    }

    if (action === "get_contact") {
      if (!contactId) return Response.json({ contact: null });
      const c = await db.entities.ClientContact.filter({ id: contactId });
      return Response.json({ contact: c?.[0] || null });
    }

    if (action === "update_contact") {
      const { phone, address } = params;
      if (!contactId) return Response.json({ error: "Contato não encontrado." }, { status: 404 });
      const updated = await db.entities.ClientContact.update(contactId, { phone, address });
      return Response.json({ contact: updated });
    }

    if (action === "get_satisfaction") {
      const surveys = await db.entities.SatisfactionSurvey.filter({ company_id: companyId });
      return Response.json({ surveys: surveys || [] });
    }

    if (action === "get_courses") {
      const allCollections = await db.entities.CourseCollection.filter({ is_active: true }) || [];
      const collections = allCollections.filter(c => !c.company_id || c.company_id === companyId);
      collections.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

      const collectionIds = collections.map(c => c.id);
      let lessons = [];
      if (collectionIds.length > 0) {
        const allLessons = await db.entities.CourseLesson.filter({ is_active: true }) || [];
        lessons = allLessons.filter(l => collectionIds.includes(l.collection_id));
        lessons.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      }

      return Response.json({ collections, lessons });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});