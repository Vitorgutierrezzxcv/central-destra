import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import { Building2, ArrowRight, TrendingUp, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabel = {
  active: { label: "Ativo", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  completed: { label: "Concluído", className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  archived: { label: "Arquivado", className: "bg-slate-500/20 text-slate-300 border-slate-500/30" }
};

export default function ClientPortalProjects() {
  const { user, userLoading, company, projects } = useClientPortal();

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-sm text-slate-400">{company?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Meus Projetos</h1>
          <p className="text-slate-400 text-sm mt-1">Selecione um projeto para acompanhar o andamento.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400">Nenhum projeto disponível no momento.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => {
              const status = statusLabel[project.status] || statusLabel.active;
              return (
                <Link
                  key={project.id}
                  to={`${createPageUrl("ClientPortalDashboard")}?project_id=${project.id}`}
                  className="group block bg-[#0D1221] border border-white/5 hover:border-blue-500/40 rounded-2xl p-6 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-white text-lg group-hover:text-blue-300 transition-colors">
                            {project.name}
                          </h2>
                          {project.service_type && (
                            <p className="text-xs text-slate-500">{project.service_type}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mb-4 ml-13">
                        <Badge className={status.className}>{status.label}</Badge>
                        {project.current_phase && (
                          <Badge className="bg-white/5 text-slate-300 border-white/10">
                            {project.current_phase}
                          </Badge>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-slate-400">Progresso geral</span>
                          <span className="text-xs font-semibold text-blue-400">{project.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={project.progress_percentage || 0} className="h-1.5 bg-white/10" />
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        {project.project_start_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Início: {format(new Date(project.project_start_date), "dd MMM yyyy", { locale: ptBR })}
                          </div>
                        )}
                        {project.estimated_end_date && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Previsão: {format(new Date(project.estimated_end_date), "dd MMM yyyy", { locale: ptBR })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/0 group-hover:bg-blue-600/10 transition-all">
                      <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}