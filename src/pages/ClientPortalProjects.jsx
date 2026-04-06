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
                  className="block bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl px-6 py-5 hover:shadow-sm hover:border-slate-200 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">{project.name}</h2>
                      </div>
                      {project.current_phase && (
                        <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mb-2">{project.current_phase}</p>
                      )}
                      {project.description && (
                        <p className="text-sm text-slate-600 font-light leading-relaxed mb-4">{project.description}</p>
                      )}
                    </div>
                    <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-2">
                        <span className="font-medium">Progresso</span>
                        <span className="font-semibold text-slate-700">{project.progress_percentage || 0}%</span>
                      </div>
                      <Progress value={project.progress_percentage || 0} className="h-2" />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-light">
                      {project.project_start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(project.project_start_date), "dd/MM/yy")}
                        </span>
                      )}
                      {project.estimated_end_date && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {format(parseISO(project.estimated_end_date), "dd/MM/yy")}
                        </span>
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