/**
 * sendWhatsApp — serviço desacoplado de envio WhatsApp
 * Suporta providers: twilio, 360dialog, generic (default)
 * Detecta automaticamente pelo formato da WHATSAPP_API_URL
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const API_URL   = Deno.env.get("WHATSAPP_API_URL")   || "";
const API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN") || "";
const FROM      = Deno.env.get("WHATSAPP_FROM_NUMBER") || "";

function detectProvider(url) {
  if (url.includes("twilio.com"))   return "twilio";
  if (url.includes("360dialog.io")) return "360dialog";
  return "generic";
}

async function sendViaTwilio(to, message) {
  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const fromFormatted = FROM.startsWith("whatsapp:") ? FROM : `whatsapp:${FROM}`;

  const body = new URLSearchParams({
    From: fromFormatted,
    To:   toFormatted,
    Body: message,
  });

  // API_TOKEN pode ser "SID:Secret" (API Key) ou já em Base64
  const basicAuth = API_TOKEN.includes(":") 
    ? btoa(API_TOKEN) 
    : API_TOKEN;

  const resp = await fetch(API_URL, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Authorization": `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Twilio error ${resp.status}: ${err}`);
  }
  return await resp.json();
}

async function sendVia360Dialog(to, message) {
  const resp = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "D360-API-KEY": API_TOKEN,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace(/\D/g, ""),
      type: "text",
      text: { body: message },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`360dialog error ${resp.status}: ${err}`);
  }
  return await resp.json();
}

async function sendViaGeneric(to, message) {
  // Generic REST: POST com JSON padrão
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({
      from:    FROM,
      to:      to,
      message: message,
      type:    "text",
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`WhatsApp API error ${resp.status}: ${err}`);
  }
  return await resp.json();
}

export async function sendWhatsAppMessage(to, message) {
  if (!to || !message) throw new Error("Parâmetros 'to' e 'message' são obrigatórios");
  if (!API_URL || !API_TOKEN) throw new Error("Credenciais WhatsApp não configuradas");

  const provider = detectProvider(API_URL);

  if (provider === "twilio")    return await sendViaTwilio(to, message);
  if (provider === "360dialog") return await sendVia360Dialog(to, message);
  return await sendViaGeneric(to, message);
}

// Handler HTTP para testes manuais
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { to, message } = await req.json();
    const result = await sendWhatsAppMessage(to, message);
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});