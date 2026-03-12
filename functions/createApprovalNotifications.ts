import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data, old_data } = payload;

    if (event.type !== 'update' || event.entity_name !== 'Task') {
      return Response.json({ ok: true });
    }

    const task = data;
    const wasUpdated = old_data?.approval_status !== task.approval_status;

    if (!task.approval_required || !wasUpdated) {
      return Response.json({ ok: true });
    }

    // Buscar o projeto para pegar o email do gestor
    const project = task.project_id ? await base44.asServiceRole.entities.Project.list().then(projects => 
      projects.find(p => p.id === task.project_id)
    ) : null;

    const projectManager = project?.project_owner_internal;
    if (!projectManager) {
      return Response.json({ ok: true });
    }

    // Criar notificação baseado no status de aprovação
    let notificationType, message;

    if (task.approval_status === 'requested') {
      notificationType = 'task_approval_requested';
      message = `Solicitação de aprovação enviada para: ${task.title}`;
    } else if (task.approval_status === 'approved') {
      notificationType = 'task_approval_approved';
      message = `Tarefa aprovada: ${task.title}`;
    } else if (task.approval_status === 'rejected') {
      notificationType = 'task_approval_rejected';
      message = `Tarefa rejeitada: ${task.title}`;
    }

    if (notificationType) {
      // Notificar o gestor do projeto
      await base44.asServiceRole.entities.Notification.create({
        user_email: projectManager,
        type: notificationType,
        message: message,
        task_id: task.id,
        task_title: task.title,
        project_id: task.project_id,
        related_user_email: task.created_by,
      });

      // Se foi aprovado ou rejeitado, notificar quem criou a solicitação
      if ((task.approval_status === 'approved' || task.approval_status === 'rejected') && task.created_by) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: task.created_by,
          type: notificationType,
          message: message,
          task_id: task.id,
          task_title: task.title,
          project_id: task.project_id,
          related_user_email: projectManager,
        });
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});