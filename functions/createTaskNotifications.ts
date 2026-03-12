import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data } = payload;

    if (event.type !== 'create' || event.entity_name !== 'Task') {
      return Response.json({ ok: true });
    }

    const task = data;

    // Se a tarefa foi atribuída a alguém, criar notificação
    if (task.assigned_to) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: task.assigned_to,
        type: 'task_assigned',
        message: `Nova tarefa atribuída: ${task.title}`,
        task_id: task.id,
        task_title: task.title,
        project_id: task.project_id,
        related_user_email: task.created_by,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});