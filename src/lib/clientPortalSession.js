/**
 * Gerencia a sessão do Portal do Cliente de forma independente do auth do Base44.
 * Usa localStorage para persistência entre sessões.
 */

const SESSION_KEY = "cp_session";

export function saveSession(token, profile, expiresAt) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, profile, expiresAt }));
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Verifica expiração local
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return getSession() !== null;
}

export function getClientProfile() {
  return getSession()?.profile || null;
}

export function getClientToken() {
  return getSession()?.token || null;
}