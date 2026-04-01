import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;
    if (!data) return Response.json({ ok: true, skipped: "no data" });

    const delivery = data;
    const project = delivery.project_id
      ? await base44.asServiceRole.entities.Project.filter({ id: delivery.project_id }).then(d => d?.[0])
      : null;

    // Find feedback for this delivery
    const feedbacks = await base44.asServiceRole.entities.DeliveryFeedback.filter({ delivery_id: delivery.id });
    const latestFeedback = feedbacks?.[0];

    if (!latestFeedback) return Response.json({ ok: true, skipped: "no feedback found" });

    const decisionLabel = {
      approved: "APROVADA ✅",
      changes_requested: "AJUSTES SOLICITADOS ⚠️",
      rejected: "REPROVADA ❌"
    }[latestFeedback.approval_status] || latestFeedback.approval_status;

    // Notify internal team members via Notification entity
    const notificationData = {
      title: `Entrega ${decisionLabel}`,
      message: `A entrega "${delivery.title}"${project ? ` do projeto "${project.name}"` : ''} foi ${decisionLabel.toLowerCase()}. ${latestFeedback.comment ? `Comentário: "${latestFeedback.comment}"` : ''}`,
      type: "delivery_feedback",
      read: false,
      link: `/ClientPortalAdmin`
    };

    await base44.asServiceRole.entities.Notification.create(notificationData);

    // If there's a task linked, update task status
    if (delivery.task_id) {
      const newTaskStatus = latestFeedback.approval_status === "approved" ? "completed" : "in_progress";
      await base44.asServiceRole.entities.Task.update(delivery.task_id, { status: newTaskStatus });
    }

    return Response.json({ ok: true, notification: "created", decision: latestFeedback.approval_status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});