import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, TrendingUp, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const statusConfig = {
  active:    { label: "Em Andamento", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  completed: { label: "Concluído",    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  archived:  { label: "Arquivado",    color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
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
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Meus Projetos</h1>
          {company && (
            <p className="text-slate-400 text-sm mt-1">{company.name} · {projects.length} projeto{projects.length !== 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Nenhum projeto disponível</p>
            <p className="text-sm mt-1">Entre em contato com a equipe Destra.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {projects.map(project => {
              const statusCfg = statusConfig[project.status] || statusConfig.active;
              return (
                <Link
                  key={project.id}
                  to={`${createPageUrl("ClientPortalProject")}?project_id=${project.id}`}
                  className="block"
                >
                  <div className="bg-[#0D1221] border border-white/5 hover:border-blue-500/30 rounded-2xl p-6 transition-all group cursor-pointer">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">{project.name}</h2>
                          {project.current_phase && (
                            <p className="text-sm text-slate-400 mt-0.5">{project.current_phase}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-sm text-slate-400 mb-5 line-clamp-2">{project.description}</p>
                    )}

                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>Progresso</span>
                        <span className="text-blue-400 font-medium">{project.progress_percentage || 0}%</span>
                      </div>
                      <Progress value={project.progress_percentage || 0} className="h-2 bg-white/10" />
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                      {project.project_start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Início: {format(parseISO(project.project_start_date), "dd/MM/yyyy")}
                        </span>
                      )}
                      {project.estimated_end_date && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Entrega: {format(parseISO(project.estimated_end_date), "dd/MM/yyyy")}
                        </span>
                      )}
                      {project.service_type && (
                        <span className="px-2 py-0.5 bg-white/5 rounded-lg">{project.service_type}</span>
                      )}
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