import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getClientProfile, isLoggedIn, saveSession, getClientToken, clearSession } from "@/lib/clientPortalSession";

/**
 * Chama a função clientPortalData via SDK (público, sem auth de usuário).
 * Toda a autenticação é feita via portal_session_token.
 */
async function callPortalData(action, params = {}) {
  const token = getClientToken();
  if (!token) {
    return { error: 'No session token available' };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const res = await Promise.race([
      base44.functions.invoke("clientPortalData", { action, token, params }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    
    clearTimeout(timeoutId);
    return res?.data ?? res;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Hook central do portal do cliente.
 * Usa clientPortalSession (localStorage) para auth própria.
 * Busca dados via clientPortalData (asServiceRole) — sem exigir usuário Base44.
 */
export function useClientPortal() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [contactId, setContactId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    async function initSession() {
      const profile = getClientProfile();
      const token = getClientToken();

      if (!profile || !token) {
        setUserLoading(false);
        return;
      }

      // Carrega imediatamente com dados locais
      setUser({
        email: profile.email,
        full_name: profile.name || profile.full_name,
        name: profile.name || profile.full_name,
        role: "client_user",
        linked_company_id: profile.linked_company_id || null,
        linked_client_contact_id: profile.linked_client_contact_id || null,
        id: profile.id,
        ...profile
      });
      setContactId(profile.linked_client_contact_id || null);
      setCompanyId(profile.linked_company_id || null);

      // Valida sessão no backend e atualiza linked_ids
      try {
        const data = await callPortalData("session_info");
        if (data?.profile) {
          const freshProfile = data.profile;
          saveSession(token, freshProfile, null);
          setUser({
            email: freshProfile.email,
            full_name: freshProfile.name || freshProfile.full_name,
            name: freshProfile.name || freshProfile.full_name,
            role: "client_user",
            linked_company_id: freshProfile.linked_company_id || null,
            linked_client_contact_id: freshProfile.linked_client_contact_id || null,
            id: freshProfile.id,
            ...freshProfile
          });
          setContactId(data.contactId || freshProfile.linked_client_contact_id || null);
          setCompanyId(data.companyId || freshProfile.linked_company_id || null);
        } else if (data?.error || !data?.profile) {
          // Sessão inválida — limpa
          clearSession();
          setUser(null);
        }
      } catch (e) {
        // Erro na chamada — limpa session e sai
        clearSession();
        setUser(null);
      }

      setUserLoading(false);
    }

    initSession();
  }, []);

  // Busca projetos e empresa via função backend
  const { data: projectsData } = useQuery({
    queryKey: ["cp_projects", contactId, companyId],
    queryFn: () => callPortalData("get_projects"),
    enabled: !!user && (!!contactId || !!companyId) && !!getClientToken(),
    retry: 0, // Não faz retry automático
  });

  const projects = projectsData?.projects || [];
  const projectAccess = projectsData?.projectAccess || [];
  const company = projectsData?.company || null;

  const isApprover =
    user?.role === "client_approver" ||
    projectAccess.some(pa => pa.can_approve);

  const authorizedProjectIds = projectAccess
    .filter(pa => pa.is_active !== false)
    .map(pa => pa.project_id);

  const getProjectPermissions = (projectId) => {
    const access = projectAccess.find(pa => pa.project_id === projectId);
    if (!access) {
      return {
        can_view: true,
        can_comment: true,
        can_approve: isApprover,
        can_rate: true,
        can_view_files: true,
        can_view_calendar: true
      };
    }
    return access;
  };

  const canAccessProject = (projectId) => {
    if (authorizedProjectIds.length === 0) return true;
    return authorizedProjectIds.includes(projectId);
  };

  return {
    user,
    userLoading,
    userProfile: user,
    company,
    companyId,
    contactId,
    clientContact: null,
    projects,
    projectAccess,
    isClientRole: true,
    isApprover,
    getProjectPermissions,
    canAccessProject,
    callPortalData
  };
}