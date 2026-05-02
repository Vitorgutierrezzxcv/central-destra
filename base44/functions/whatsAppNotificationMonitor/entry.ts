/**
 * whatsAppNotificationMonitor — cron job diário
 * Monitora tarefas/projetos com prazo próximo ou atrasado
 * e envia alertas WhatsApp evitando duplicidades
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const API_URL   = Deno.env.get("WHATSAPP_API_URL")    || "";
const API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN")  || "";
const FROM      = Deno.env.get("WHATSAPP_FROM_NUMBER") || "";

// ─── WhatsApp send (inlined, provider-agnostic) ──────────────────────────────

function detectProvider(url) {
  if (url.includes("twilio.com"))   return "twilio";
  if (url.includes("360dialog.io")) return "360dialog";
  return "generic";
}

async function sendWhatsAppMessage(to, message) {
  if (!to || !message) throw new Error("Parâmetros 'to' e 'message' são obrigatórios");
  if (!API_URL || !API_TOKEN) throw new Error("Credenciais WhatsApp não configuradas");

  const provider = detectProvider(API_URL);

  if (provider === "twilio") {
    const toFmt   = to.startsWith("whatsapp:")   ? to   : `whatsapp:${to}`;
    const fromFmt = FROM.startsWith("whatsapp:") ? FROM : `whatsapp:${FROM}`;
    const body = new URLSearchParams({ From: fromFmt, To: toFmt, Body: message });
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": `Basic ${API_TOKEN}` },
      body: body.toString(),
    });
    if (!resp.ok) throw new Error(`Twilio ${resp.status}: ${await resp.text()}`);
    return await resp.json();
  }

  if (provider === "360dialog") {
    const resp = await fetch(`${API_URL}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "D360-API-KEY": API_TOKEN },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: to.replace(/\D/g, ""), type: "text", text: { body: message } }),
    });
    if (!resp.ok) throw new Error(`360dialog ${resp.status}: ${await resp.text()}`);
    return await resp.json();
  }

  // generic REST
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_TOKEN}` },
    body: JSON.stringify({ from: FROM, to, message, type: "text" }),
  });
  if (!resp.ok) throw new Error(`WhatsApp API ${resp.status}: ${await resp.text()}`);
  return await resp.json();
}

// ─── Helpers de data ─────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function diffDays(dateStr) {
  const now    = new Date(todayStr());
  const target = new Date(dateStr);
  return Math.round((target - now) / 86400000);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Templates de mensagem ───────────────────────────────────────────────────

function msgTaskDue(taskName, projectName, daysLeft, dueDate) {
  if (daysLeft === 0)
    return `⏰ *Tarefa vence hoje:* ${taskName}\n📁 Projeto: ${projectName}\n📅 Prazo: ${formatDate(dueDate)}\n\nFinalize hoje para evitar atraso.`;
  return `⚠️ *Tarefa próxima do prazo:* ${taskName}\n📁 Projeto: ${projectName}\n📅 Prazo: ${formatDate(dueDate)} (${daysLeft} dia${daysLeft > 1 ? "s" : ""})\n\nPriorize para evitar atraso.`;
}

function msgTaskOverdue(taskName, projectName, dueDate) {
  return `🚨 *Tarefa atrasada:* ${taskName}\n📁 Projeto: ${projectName}\n📅 Venceu em: ${formatDate(dueDate)}\n\nAção imediata necessária.`;
}

function msgProjectDue(clientName, projectName, daysLeft, dueDate) {
  if (daysLeft === 0)
    return `Olá, ${clientName}. 🗓️ O projeto *${projectName}* vence hoje (${formatDate(dueDate)}). Seguimos trabalhando para garantir a melhor entrega.`;
  return `Olá, ${clientName}. 📌 O projeto *${projectName}* está próximo do prazo — ${formatDate(dueDate)}. Seguimos trabalhando para garantir a melhor entrega.`;
}

function msgProjectOverdue(clientName, projectName, dueDate) {
  return `Olá, ${clientName}. O projeto *${projectName}* passou pelo prazo original (${formatDate(dueDate)}) e está em fase final. Em breve traremos uma atualização completa. Obrigado pela compreensão.`;
}

// ─── Controle de duplicidade ─────────────────────────────────────────────────

async function alreadySent(base44, entityId, alertType, refDate) {
  const logs = await base44.asServiceRole.entities.WhatsAppNotificationLog.filter({
    entity_id:      entityId,
    alert_type:     alertType,
    reference_date: refDate,
    status:         "sent",
  });
  return logs.length > 0;
}

async function logNotification(base44, data) {
  await base44.asServiceRole.entities.WhatsAppNotificationLog.create({
    ...data,
    sent_at: new Date().toISOString(),
  });
}

// ─── Envio com log ───────────────────────────────────────────────────────────

async function sendAndLog(base44, phone, message, logData) {
  const ref = todayStr();
  const already = await alreadySent(base44, logData.entity_id, logData.alert_type, ref);
  if (already) {
    console.log(`[SKIP] Já enviado hoje: ${logData.entity_id} / ${logData.alert_type}`);
    return;
  }
  try {
    await sendWhatsAppMessage(phone, message);
    await logNotification(base44, { ...logData, status: "sent", message_sent: message, reference_date: ref });
    console.log(`[SENT] ${logData.alert_type} → ${phone}`);
  } catch (err) {
    await logNotification(base44, { ...logData, status: "failed", message_sent: message, error_message: err.message, reference_date: ref });
    console.error(`[FAIL] ${logData.alert_type} → ${phone}: ${err.message}`);
  }
}

// ─── Telefone dos usuários / clientes ────────────────────────────────────────

async function getUserPhone(base44, email) {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: email });
  return profiles[0]?.phone || null;
}

async function getClientContact(base44, companyId) {
  const primary = await base44.asServiceRole.entities.ClientContact.filter({ company_id: companyId, is_primary: true });
  if (primary[0]?.phone) return { phone: primary[0].phone, name: primary[0].name };
  const all = await base44.asServiceRole.entities.ClientContact.filter({ company_id: companyId });
  if (all[0]?.phone) return { phone: all[0].phone, name: all[0].name };
  return null;
}

// ─── Processamento de tarefas ─────────────────────────────────────────────────

async function processTasks(base44, config) {
  const tasks = await base44.asServiceRole.entities.Task.filter({ status: "pending" });
  const inProgress = await base44.asServiceRole.entities.Task.filter({ status: "in_progress" });
  const allTasks = [...tasks, ...inProgress];
  const projectCache = {};

  for (const task of allTasks) {
    if (!task.end_date || !task.assigned_to) continue;

    const days = diffDays(task.end_date);
    // só processa se relevante
    if (days > 2) continue;

    if (!projectCache[task.project_id]) {
      const projs = await base44.asServiceRole.entities.Project.filter({ id: task.project_id });
      projectCache[task.project_id] = projs[0] || null;
    }
    const project = projectCache[task.project_id];
    const projectName = project?.name || "Projeto";

    const phone = await getUserPhone(base44, task.assigned_to);
    if (!phone) continue;

    const baseLog = {
      recipient_type:  "internal",
      recipient_email: task.assigned_to,
      recipient_phone: phone,
      entity_type:     "task",
      entity_id:       task.id,
      entity_name:     task.title,
      project_id:      task.project_id,
      project_name:    projectName,
    };

    if (days === 2 && config.internal_task_due_2days) {
      await sendAndLog(base44, phone, msgTaskDue(task.title, projectName, 2, task.end_date), { ...baseLog, alert_type: "task_due_2days" });
    } else if (days === 1 && config.internal_task_due_1day) {
      await sendAndLog(base44, phone, msgTaskDue(task.title, projectName, 1, task.end_date), { ...baseLog, alert_type: "task_due_1day" });
    } else if (days === 0 && config.internal_task_due_today) {
      await sendAndLog(base44, phone, msgTaskDue(task.title, projectName, 0, task.end_date), { ...baseLog, alert_type: "task_due_today" });
    } else if (days < 0 && config.internal_task_overdue) {
      await sendAndLog(base44, phone, msgTaskOverdue(task.title, projectName, task.end_date), { ...baseLog, alert_type: "task_overdue" });
    }
  }
}

// ─── Processamento de projetos ────────────────────────────────────────────────

async function processProjects(base44, config) {
  const projects = await base44.asServiceRole.entities.Project.filter({ status: "active" });

  for (const project of projects) {
    if (!project.estimated_end_date || !project.company_id) continue;
    if (!project.client_portal_enabled) continue;

    const days = diffDays(project.estimated_end_date);
    if (days > 1) continue;

    const clientInfo = await getClientContact(base44, project.company_id);
    if (!clientInfo) continue;

    const { phone, name: clientName } = clientInfo;

    const baseLog = {
      recipient_type:  "client",
      recipient_name:  clientName,
      recipient_phone: phone,
      entity_type:     "project",
      entity_id:       project.id,
      entity_name:     project.name,
      project_id:      project.id,
      project_name:    project.name,
    };

    if (days === 1 && config.client_project_due_1day) {
      await sendAndLog(base44, phone, msgProjectDue(clientName, project.name, 1, project.estimated_end_date), { ...baseLog, alert_type: "project_due_1day" });
    } else if (days === 0 && config.client_project_due_today) {
      await sendAndLog(base44, phone, msgProjectDue(clientName, project.name, 0, project.estimated_end_date), { ...baseLog, alert_type: "project_due_today" });
    } else if (days < 0 && config.client_project_overdue) {
      await sendAndLog(base44, phone, msgProjectOverdue(clientName, project.name, project.estimated_end_date), { ...baseLog, alert_type: "project_overdue" });
    }
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let configs = await base44.asServiceRole.entities.WhatsAppNotificationConfig.filter({ config_key: "global" });
    let config = configs[0];

    if (!config) {
      config = await base44.asServiceRole.entities.WhatsAppNotificationConfig.create({
        config_key: "global",
        internal_task_due_2days: true,
        internal_task_due_1day:  true,
        internal_task_due_today: true,
        internal_task_overdue:   true,
        client_project_due_1day: false,
        client_project_due_today: true,
        client_project_overdue:  true,
      });
    }

    console.log("[MONITOR] Iniciando — " + todayStr());
    await processTasks(base44, config);
    await processProjects(base44, config);
    console.log("[MONITOR] Concluído.");

    return Response.json({ success: true, date: todayStr() });
  } catch (error) {
    console.error("[MONITOR ERROR]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});