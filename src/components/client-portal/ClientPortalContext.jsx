import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Ctx = createContext(null);

export function ClientPortalProvider({ children }) {
  const qc = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["cpUser"],
    queryFn: async () => {
      const auth = await base44.auth.isAuthenticated();
      if (!auth) return null;
      return base44.auth.me();
    },
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  const isClientRole = user?.role === "client_user" || user?.role === "client_approver";

  // Find ClientContact by email to get company and access info
  const { data: contacts = [], isLoading: contactLoading } = useQuery({
    queryKey: ["cpContact", user?.email],
    queryFn: () => base44.entities.ClientContact.filter({ email: user.email }),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });
  const clientContact = contacts[0] ?? null;

  // Sync company_id to user profile once so legacy pages work
  useEffect(() => {
    if (clientContact?.company_id && user && !user.company_id) {
      base44.auth.updateMe({ company_id: clientContact.company_id })
        .then(() => qc.invalidateQueries({ queryKey: ["cpUser"] }))
        .catch(() => {});
    }
  }, [clientContact?.company_id, user?.company_id]);

  const companyId = clientContact?.company_id || user?.company_id || null;

  const { data: company } = useQuery({
    queryKey: ["cpCompany", companyId],
    queryFn: () => base44.entities.Company.filter({ id: companyId }).then(r => r[0] ?? null),
    enabled: !!companyId,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["cpProjects", companyId],
    queryFn: () => base44.entities.Project.filter({ company_id: companyId, client_portal_enabled: true }),
    enabled: !!companyId,
  });

  const { data: projectAccesses = [] } = useQuery({
    queryKey: ["cpAccesses", clientContact?.id],
    queryFn: () => base44.entities.ProjectClientAccess.filter({ client_contact_id: clientContact.id }),
    enabled: !!clientContact?.id,
  });

  const [selectedProjectId, setSelectedProjectIdState] = useState(() => {
    try { return sessionStorage.getItem("destra_portal_project") || null; } catch { return null; }
  });

  const setSelectedProject = (id) => {
    try { sessionStorage.setItem("destra_portal_project", id || ""); } catch {}
    setSelectedProjectIdState(id);
  };

  // Auto-select single project
  useEffect(() => {
    if (projects.length === 1 && !selectedProjectId) {
      setSelectedProject(projects[0].id);
    }
  }, [projects.length]);

  const selectedProject =
    projects.find(p => p.id === selectedProjectId) ??
    (projects.length === 1 ? projects[0] : null);

  const projectAccess = projectAccesses.find(pa => pa.project_id === selectedProject?.id) ?? null;

  const isLoading = userLoading || (!!user && (contactLoading || projectsLoading));

  const canApprove = user?.role === "client_approver" && projectAccess?.can_approve !== false && projectAccess?.is_active !== false;
  const canComment = projectAccess?.can_comment !== false;
  const canViewFiles = projectAccess?.can_view_files !== false;
  const canViewCalendar = projectAccess?.can_view_calendar !== false;
  const isAccessActive = projectAccess?.is_active !== false;

  return (
    <Ctx.Provider value={{
      user, clientContact, company, projects, selectedProject,
      setSelectedProject, projectAccess, projectAccesses,
      isLoading, isClientRole,
      canApprove, canComment, canViewFiles, canViewCalendar, isAccessActive,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useClientPortal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useClientPortal must be inside ClientPortalProvider");
  return ctx;
}