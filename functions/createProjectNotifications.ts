import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data } = payload;

    if (event.type !== 'update' || event.entity_name !== 'Project') {
      return Response.json({ ok: true });
    }

    const project = data;

    // Buscar todas as tarefas do projeto
    const tasks = await base44.asServiceRole.entities.Task.filter({ project_id: project.id });
    
    // Coletar emails únicos de usuários envolvidos (responsáveis e criadores)
    const userEmails = new Set();
    tasks.forEach(task => {
      if (task.assigned_to) userEmails.add(task.assigned_to);
      if (task.created_by) userEmails.add(task.created_by);
    });

    // Notificar todos os usuários envolvidos
    await Promise.all(
      Array.from(userEmails).map(userEmail =>
        base44.asServiceRole.entities.Notification.create({
          user_email: userEmail,
          type: 'project_updated',
          message: `Projeto atualizado: ${project.name}`,
          project_id: project.id,
          project_name: project.name,
          related_user_email: project.project_owner_internal,
        })
      )
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});