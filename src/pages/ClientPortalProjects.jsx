import React from "react";
import { Building2, Loader2 } from "lucide-react";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ProjectCard from "@/components/client-portal/ProjectCard";

export default function ClientPortalProjects() {
  const { userLoading, company, projects } = useClientPortal();
  
  const { data: invoices = [] } = useQuery({
    queryKey: ["client_invoices_projects"],
    queryFn: () => base44.entities.ClientInvoice.list(),
    enabled: !userLoading
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Hero Section */}
      <div className="text-white px-5 md:px-4 pt-28 md:pt-12 pb-8 md:pb-12">
        <div className="max-w-lg md:max-w-6xl mx-auto">
          <p className="text-sm md:text-base tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">Destra</p>
          <h1 className="text-8xl md:text-7xl leading-[1.1] font-extralight tracking-tight mb-6">
             Global
           </h1>

        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 px-5 md:px-4 pb-8 md:pb-12 overflow-y-auto">
        <div className="max-w-lg md:max-w-6xl mx-auto">
        {projects.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-center">
              <Building2 className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 font-light">Nenhum projeto disponível</p>
            </div>
          ) : (
            <div className="space-y-3">
            {projects.map(project => {
              const projectInvoices = invoices.filter(inv => inv.project_id === project.id);
              const pendingAmount = projectInvoices
                .filter(inv => inv.status === "pending")
                .reduce((sum, inv) => sum + (inv.amount || 0), 0);
              const financialData = pendingAmount > 0 ? `R$ ${pendingAmount.toLocaleString('pt-BR')}` : null;

              return (
                <ProjectCard 
                  key={project.id}
                  project={project}
                  financialData={financialData}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}