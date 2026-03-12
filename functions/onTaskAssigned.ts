import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data } = body;

    if (!data?.assigned_to) {
      return Response.json({ ok: true });
    }

    const shouldNotify =
      event.type === 'create'
      || (event.type === 'update' && old_data?.assigned_to !== data.assigned_to);

    if (!shouldNotify) {
      return Response.json({ ok: true });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_email: data.assigned_to,
      type: 'task_assigned',
      message: `Você foi atribuído à tarefa: "${data.title}"`,
      task_id: data.id,
      task_title: data.title,
      is_read: false,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});