import React from "react";
import { Building2, TrendingUp, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const statusConfig = {
  active:    { label: "Em Andamento", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Concluído",    color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  archived:  { label: "Arquivado",    color: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function ClientPortalProjects() {
  const { userLoading, company, projects } = useClientPortal();

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 pt-14 pb-20">
        <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-7">
          Meus Projetos
        </p>
        <h1 className="text-[3.25rem] leading-[1.1] font-extralight text-slate-900 tracking-tight mb-2">
          Seus<br />Projetos
        </h1>
        <p className="text-[0.9rem] text-slate-400 font-light leading-relaxed mb-8">
          Acompanhe o andamento de todos os<br />seus projetos em um único lugar.
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5">
        {projects.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-center">
              <Building2 className="w-8 h-8 text-slate-200 mb-4" />
              <p className="text-slate-400 font-light">Nenhum projeto disponível</p>
            </div>
          ) : (
            <div className="space-y-3">
            {projects.map(project => {
              const statusCfg = statusConfig[project.status] || statusConfig.active;
              return (
                <Link
                  key={project.id}
                  to={`${createPageUrl("ClientPortalProject")}?project_id=${project.id}`}
                  className="block border border-slate-100 rounded-2xl px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="text-sm font-medium text-slate-900">{project.name}</h2>
                        <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                      </div>
                      {project.current_phase && (
                        <p className="text-[10px] text-slate-400 font-light">{project.current_phase}</p>
                      )}
                      {project.description && (
                        <p className="text-xs text-slate-400 font-light mt-1 line-clamp-1">{project.description}</p>
                      )}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Progresso</span>
                          <span className="font-medium">{project.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={project.progress_percentage || 0} className="h-1.5" />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-extralight text-slate-900">{project.progress_percentage || 0}</span>
                      <span className="text-xs text-slate-400 ml-0.5">%</span>
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