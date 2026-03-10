import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Hook central do portal do cliente.
 * Carrega user → userProfile → company → projectAccess → projects
 */
export function useClientPortal() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    base44.auth
      .me()
      .then(u => { setUser(u); setUserLoading(false); })
      .catch(() => setUserLoading(false));
  }, []);

  const isClientRole =
    user?.role === "client_user" || user?.role === "client_approver";

  // Perfil estendido (linked_company_id, linked_client_contact_id)
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () =>
      base44.entities.UserProfile.filter({ user_email: user.email })
        .then(d => d?.[0] || null),
    enabled: !!user?.email
  });

  // company_id: vem do perfil ou do user.linked_company_id (fallback legado)
  const companyId = userProfile?.linked_company_id || user?.linked_company_id || null;
  const contactId = userProfile?.linked_client_contact_id || user?.linked_client_contact_id || null;

  const { data: company } = useQuery({
    queryKey: ["client_company", companyId],
    queryFn: () =>
      base44.entities.Company.filter({ id: companyId }).then(d => d?.[0] || null),
    enabled: !!companyId
  });

  // Acessos explícitos a projetos (por ClientContact)
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
    projects,
    projectAccess,
    isClientRole,
    isApprover,
    getProjectPermissions,
    canAccessProject
  };
}