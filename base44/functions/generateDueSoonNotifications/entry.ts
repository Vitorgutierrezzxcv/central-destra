import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date();
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    const todayStr = today.toISOString().split('T')[0];
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    const tasks = await base44.asServiceRole.entities.Task.list();
    const dueSoonTasks = tasks.filter(t =>
      t.end_date &&
      t.end_date >= todayStr &&
      t.end_date <= in3DaysStr &&
      t.status !== 'completed' &&
      t.assigned_to
    );

    let created = 0;
    for (const task of dueSoonTasks) {
      const existing = await base44.asServiceRole.entities.Notification.filter({
        task_id: task.id,
        type: 'deadline_approaching',
        user_email: task.assigned_to,
      });

      const alreadyNotifiedToday = existing.some(n => {
        const notifDate = n.created_date?.split('T')[0];
        return notifDate === todayStr;
      });

      if (!alreadyNotifiedToday) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: task.assigned_to,
          type: 'deadline_approaching',
          message: `Prazo próximo: "${task.title}" vence em ${task.end_date.split('-').reverse().join('/')}`,
          task_id: task.id,
          task_title: task.title,
          is_read: false,
        });
        created++;
      }
    }

    return Response.json({ ok: true, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});