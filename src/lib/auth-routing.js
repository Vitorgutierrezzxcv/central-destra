/**
 * Utilitário centralizado de roteamento por autenticação.
 * Segue a arquitetura recomendada pelo PDF de diagnóstico.
 */

export const LOGIN_PATH = "/Autenticar";
export const ADMIN_HOME = "/";          // Central Destra (rota raiz interna)
export const CLIENT_HOME = "/ClientPortalDashboard";

/**
 * Verifica se um caminho é uma rota interna segura (não abre para redirect externo).
 */
function isSafeInternalPath(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//");
}

/**
 * Normaliza e valida o parâmetro ?next=
 * Só aceita rotas internas conhecidas (portal do cliente ou app interno).
 */
export function normalizeNext(next) {
  if (!isSafeInternalPath(next)) return null;
  // Aceita qualquer rota interna que comece com / e não seja externa
  return next;
}

/**
 * Monta a URL de login com parâmetro ?next= seguro.
 */
export function buildLoginHref(next) {
  const safeNext = normalizeNext(next);
  return safeNext
    ? `${LOGIN_PATH}?next=${encodeURIComponent(safeNext)}`
    : LOGIN_PATH;
}

/**
 * Verifica se o destino é o Portal do Cliente.
 */
export function isClientPortalPath(path) {
  return typeof path === "string" && path.toLowerCase().startsWith("/clientportal");
}