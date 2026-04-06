import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getClientProfile, isLoggedIn } from "@/lib/clientPortalSession";

/**
 * Hook central do portal do cliente.
 * Usa auth própria do portal (clientPortalSession) — independente do Base44 auth.
 * 
 * Fluxo de resolução do contato/empresa:
 * 1. Tenta pegar linked_client_contact_id do UserProfile
 * 2. Fallback: busca ClientContact pelo email do usuário logado
 * 3. Fallback: usa linked_company_id direto do UserProfile
 */
export function useClientPortal() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const profile = getClientProfile();
    if (profile) {
      setUser({
        email: profile.email,
        full_name: profile.name,
        role: "client_user",
        linked_company_id: profile.linked_company_id || null,
        linked_client_contact_id: profile.linked_client_contact_id || null,
        ...profile
      });
    }
    setUserLoading(false);
  }, []);

  const isClientRole = true;

  // Perfil estendido do portal
  const { data: userProfile } = useQuery({
    queryKey: ["cp_userProfile", user?.email],
    queryFn: () =>
      base44.entities.UserProfile.filter({ user_email: user.email })
        .then(d => d?.[0] || null),
    enabled: !!user?.email
  });

  // Busca ClientContact pelo email (fallback quando linked_client_contact_id não está preenchido)
  const { data: clientContactByEmail } = useQuery({
    queryKey: ["cp_clientContact_email", user?.email],
    queryFn: () =>
      base44.entities.ClientContact.filter({ email: user.email })
        .then(d => d?.[0] || null),
    enabled: !!user?.email
  });

  // Resolve o contactId: prioridade userProfile > sessão > busca por email
  const contactId =
    userProfile?.linked_client_contact_id ||
    user?.linked_client_contact_id ||
    clientContactByEmail?.id ||
    null;

  // Resolve o companyId: prioridade contact > userProfile > sessão
  const companyIdFromContact = clientContactByEmail?.company_id || null;
  const companyId =
    userProfile?.linked_company_id ||
    user?.linked_company_id ||
    companyIdFromContact ||
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

  // Todos os projetos da empresa com portal ativo
  const { data: allCompanyProjects = [] } = useQuery({
    queryKey: ["client_all_projects", companyId],
    queryFn: () =>
      base44.entities.Project.filter({
        company_id: companyId,
        client_portal_enabled: true
      }),
    enabled: !!companyId
  });

  // Se há acesso explícito por projeto, filtra; senão mostra todos da empresa
  const authorizedIds = projectAccess.length > 0
    ? projectAccess.map(pa => pa.project_id)
    : null;

  const projects = authorizedIds
    ? allCompanyProjects.filter(p => authorizedIds.includes(p.id))
    : allCompanyProjects;

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
    if (!isClientRole) return true;
    if (!authorizedIds) return true;
    return authorizedIds.includes(projectId);
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
    isClientRole,
    isApprover,
    getProjectPermissions,
    canAccessProject
  };
}