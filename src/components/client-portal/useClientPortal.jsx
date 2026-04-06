import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getClientProfile, isLoggedIn, saveSession, getClientToken } from "@/lib/clientPortalSession";

/**
 * Hook central do portal do cliente.
 * 
 * Lógica: EMPRESA → PROJETO → TAREFAS
 * 
 * 1. Resolve email da sessão local
 * 2. Valida sessão no backend (atualiza linked_ids)
 * 3. Busca ClientContact pelo email → resolve company_id
 * 4. Busca todos os projetos da empresa (sem filtro visible_to_client)
 * 5. Retorna projetos, dados da empresa, contactId
 */
export function useClientPortal() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

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

      // Valida sessão no backend e atualiza linked_ids
      try {
        const res = await base44.functions.invoke("clientPortalAuth", { action: "validate", token });
        const data = res?.data ?? res;
        if (data?.valid && data?.profile) {
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
        }
      } catch (e) {
        // Silencia erros de validação — usa dados locais
      }

      setUserLoading(false);
    }

    initSession();
  }, []);

  // Busca ClientContact pelo email — fonte primária do contactId e company_id
  const { data: clientContactByEmail } = useQuery({
    queryKey: ["cp_clientContact_email", user?.email],
    queryFn: () =>
      base44.entities.ClientContact.filter({ email: user.email })
        .then(d => d?.[0] || null),
    enabled: !!user?.email
  });

  // Perfil estendido do portal para pegar linked_ids persistidos
  const { data: userProfile } = useQuery({
    queryKey: ["cp_userProfile", user?.email],
    queryFn: () =>
      base44.entities.UserProfile.filter({ user_email: user.email })
        .then(d => d?.[0] || null),
    enabled: !!user?.email
  });

  // Resolve contactId: prioridade clientContactByEmail > userProfile > sessão
  const contactId =
    clientContactByEmail?.id ||
    userProfile?.linked_client_contact_id ||
    user?.linked_client_contact_id ||
    null;

  // Resolve companyId: prioridade clientContact > userProfile > sessão
  const companyId =
    clientContactByEmail?.company_id ||
    userProfile?.linked_company_id ||
    user?.linked_company_id ||
    null;

  const { data: company } = useQuery({
    queryKey: ["client_company", companyId],
    queryFn: () => base44.entities.Company.list().then(d => d.find(c => c.id === companyId) || null),
    enabled: !!companyId
  });

  // Acessos explícitos a projetos pelo contactId
  const { data: projectAccess = [] } = useQuery({
    queryKey: ["client_project_access", contactId],
    queryFn: () =>
      base44.entities.ProjectClientAccess.filter({ client_contact_id: contactId }),
    enabled: !!contactId
  });

  // Todos os projetos da empresa — base primária, sem filtros artificiais
  const { data: allCompanyProjects = [] } = useQuery({
    queryKey: ["client_company_projects", companyId],
    queryFn: () => base44.entities.Project.filter({ company_id: companyId }),
    enabled: !!companyId
  });

  // Projetos autorizados pelo access (ativos)
  const authorizedProjectIds = projectAccess
    .filter(pa => pa.is_active !== false)
    .map(pa => pa.project_id);

  // Se há acessos explícitos, mostra esses projetos
  // Senão, fallback para todos os projetos da empresa com portal ativo
  let projects;
  if (authorizedProjectIds.length > 0) {
    projects = allCompanyProjects.filter(p => authorizedProjectIds.includes(p.id));
  } else {
    projects = allCompanyProjects.filter(p => p.client_portal_enabled);
  }

  const isApprover =
    user?.role === "client_approver" ||
    projectAccess.some(pa => pa.can_approve);

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
    userProfile,
    company,
    companyId,
    contactId,
    clientContact: clientContactByEmail,
    projects,
    projectAccess,
    isClientRole: true,
    isApprover,
    getProjectPermissions,
    canAccessProject
  };
}