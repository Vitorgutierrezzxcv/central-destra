import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getClientProfile, isLoggedIn } from "@/lib/clientPortalSession";

/**
 * Hook central do portal do cliente.
 * Auth própria via clientPortalSession (localStorage).
 *
 * Resolução do vínculo cliente → empresa → projetos:
 * 1. Busca UserProfile pelo email da sessão
 * 2. Busca ClientContact pelo email (fallback)
 * 3. company_id vem: ClientContact.company_id > UserProfile.linked_company_id > sessão
 * 4. Projects: filtra por ProjectClientAccess.client_contact_id OU por company_id + client_portal_enabled
 */
export function useClientPortal() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const profile = getClientProfile();
    if (profile) {
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
    }
    setUserLoading(false);
  }, []);

  // Perfil estendido do portal — re-fetch para pegar linked_ids atualizados
  const { data: userProfile } = useQuery({
    queryKey: ["cp_userProfile", user?.email],
    queryFn: () =>
      base44.entities.UserProfile.filter({ user_email: user.email })
        .then(d => d?.[0] || null),
    enabled: !!user?.email
  });

  // Busca ClientContact pelo email
  const { data: clientContactByEmail } = useQuery({
    queryKey: ["cp_clientContact_email", user?.email],
    queryFn: () =>
      base44.entities.ClientContact.filter({ email: user.email })
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
    queryFn: () =>
      base44.entities.Company.filter({ id: companyId }).then(d => d?.[0] || null),
    enabled: !!companyId
  });

  // Acessos explícitos a projetos pelo contactId
  const { data: projectAccess = [] } = useQuery({
    queryKey: ["client_project_access", contactId],
    queryFn: () =>
      base44.entities.ProjectClientAccess.filter({
        client_contact_id: contactId,
        is_active: true
      }),
    enabled: !!contactId
  });

  // Todos os projetos da empresa (com ou sem portal ativo)
  const { data: allCompanyProjects = [] } = useQuery({
    queryKey: ["client_all_projects", companyId],
    queryFn: () => base44.entities.Project.filter({ company_id: companyId }),
    enabled: !!companyId
  });

  // Projetos explicitamente autorizados pelo access (busca independente para garantir)
  const authorizedProjectIds = projectAccess.length > 0
    ? projectAccess.filter(pa => pa.is_active !== false).map(pa => pa.project_id)
    : null;

  // Se há acessos explícitos, mostra esses projetos; senão mostra todos com portal ativo
  const projects = authorizedProjectIds
    ? allCompanyProjects.filter(p => authorizedProjectIds.includes(p.id))
    : allCompanyProjects.filter(p => p.client_portal_enabled);

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
    if (!authorizedProjectIds) return true;
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