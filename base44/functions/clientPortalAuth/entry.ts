import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function hashPassword(password) {
  const salt = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return salt + ":" + hashHex;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex === hash;
}

const SESSION_DAYS = 30;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, email, password, name, token } = body;

    // ─── VALIDATE SESSION ──────────────────────────────────────
    if (action === "validate") {
      if (!token) return Response.json({ valid: false }, { status: 401 });

      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ portal_session_token: token });
      const profile = profiles?.[0];
      if (!profile) return Response.json({ valid: false }, { status: 401 });

      const expired = profile.portal_session_expires && new Date(profile.portal_session_expires) < new Date();
      if (expired) return Response.json({ valid: false, reason: "expired" }, { status: 401 });

      let linked_client_contact_id = profile.linked_client_contact_id || null;
      let linked_company_id = profile.linked_company_id || null;

      if (!linked_client_contact_id) {
        const contacts = await base44.asServiceRole.entities.ClientContact.filter({ email: profile.user_email });
        const contact = contacts?.[0];
        if (contact) {
          linked_client_contact_id = contact.id;
          linked_company_id = contact.company_id || linked_company_id;
          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            linked_client_contact_id,
            linked_company_id: linked_company_id || profile.linked_company_id,
          });
        }
      }

      return Response.json({
        valid: true,
        profile: {
          id: profile.id,
          email: profile.user_email,
          name: profile.full_name || profile.display_name || profile.user_email,
          linked_company_id,
          linked_client_contact_id,
          portal_type: profile.portal_type || "client"
        }
      });
    }

    if (!email || !password) {
      return Response.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: normalizedEmail });
    const existing = profiles?.[0] || null;

    const newToken = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // ─── LOGIN ─────────────────────────────────────────────────
    if (action === "login") {
      if (!existing) {
        // Verifica se existe um ClientContact com esse email (usuário válido mas sem cadastro no portal)
        const contacts = await base44.asServiceRole.entities.ClientContact.filter({ email: normalizedEmail });
        if (contacts?.[0]) {
          return Response.json({ error: "Você ainda não criou uma senha para o portal. Use a aba 'Cadastrar' para criar sua senha." }, { status: 404 });
        }
        return Response.json({ error: "Email não encontrado. Verifique o email ou entre em contato com a equipe Destra." }, { status: 404 });
      }
      if (!existing.portal_password_hash) {
        return Response.json({ error: "Você ainda não criou uma senha para o portal. Use a aba 'Cadastrar' para criar sua senha." }, { status: 404 });
      }

      const match = await verifyPassword(password, existing.portal_password_hash);
      if (!match) {
        return Response.json({ error: "Senha incorreta." }, { status: 401 });
      }

      let linked_client_contact_id = existing.linked_client_contact_id || null;
      let linked_company_id = existing.linked_company_id || null;

      const contacts = await base44.asServiceRole.entities.ClientContact.filter({ email: normalizedEmail });
      const contact = contacts?.[0];
      if (contact) {
        linked_client_contact_id = contact.id;
        linked_company_id = contact.company_id || linked_company_id;
      }

      const updateData = {
        portal_session_token: newToken,
        portal_session_expires: expiresAt,
      };
      if (linked_client_contact_id) updateData.linked_client_contact_id = linked_client_contact_id;
      if (linked_company_id) updateData.linked_company_id = linked_company_id;

      await base44.asServiceRole.entities.UserProfile.update(existing.id, updateData);

      return Response.json({
        success: true,
        token: newToken,
        expiresAt,
        profile: {
          id: existing.id,
          email: normalizedEmail,
          name: existing.full_name || existing.display_name || normalizedEmail.split("@")[0],
          linked_company_id,
          linked_client_contact_id,
          portal_type: "client"
        }
      });
    }

    // ─── REGISTER ──────────────────────────────────────────────
    if (action === "register") {
      if (existing && existing.portal_password_hash) {
        return Response.json({ error: "Este email já está cadastrado. Faça login." }, { status: 409 });
      }

      const hash = await hashPassword(password);

      let linked_client_contact_id = null;
      let linked_company_id = null;
      const contacts = await base44.asServiceRole.entities.ClientContact.filter({ email: normalizedEmail });
      const contact = contacts?.[0];
      if (contact) {
        linked_client_contact_id = contact.id;
        linked_company_id = contact.company_id || null;
      }

      let profile;
      if (existing) {
        await base44.asServiceRole.entities.UserProfile.update(existing.id, {
          portal_password_hash: hash,
          portal_session_token: newToken,
          portal_session_expires: expiresAt,
          full_name: name || existing.full_name,
          portal_type: "client",
          ...(linked_client_contact_id ? { linked_client_contact_id } : {}),
          ...(linked_company_id ? { linked_company_id } : {}),
        });
        profile = existing;
      } else {
        profile = await base44.asServiceRole.entities.UserProfile.create({
          user_email: normalizedEmail,
          full_name: name || normalizedEmail.split("@")[0],
          display_name: name || normalizedEmail.split("@")[0],
          portal_type: "client",
          portal_password_hash: hash,
          portal_session_token: newToken,
          portal_session_expires: expiresAt,
          ...(linked_client_contact_id ? { linked_client_contact_id } : {}),
          ...(linked_company_id ? { linked_company_id } : {}),
        });
      }

      return Response.json({
        success: true,
        token: newToken,
        expiresAt,
        profile: {
          id: profile.id,
          email: normalizedEmail,
          name: name || profile.full_name || normalizedEmail.split("@")[0],
          linked_company_id: linked_company_id || profile.linked_company_id || null,
          linked_client_contact_id: linked_client_contact_id || profile.linked_client_contact_id || null,
          portal_type: "client"
        }
      });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});