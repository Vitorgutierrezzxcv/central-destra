import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;

    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const task = data;
    if (!task?.project_id || task?.parent_task_id) {
      // Ignora subtarefas
      return Response.json({ skipped: true, reason: 'subtask or no project' });
    }

    // Busca todos os acessos desse projeto com auto_visible_tasks = true
    const accessList = await base44.asServiceRole.entities.ProjectClientAccess.filter({
      project_id: task.project_id,
      auto_visible_tasks: true
    });

    if (accessList.length === 0) {
      return Response.json({ skipped: true, reason: 'no auto_visible access' });
    }

    // Marca a tarefa como visível ao cliente
    await base44.asServiceRole.entities.Task.update(task.id, {
      visible_to_client: true
    });

    return Response.json({ success: true, taskId: task.id, accessCount: accessList.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});