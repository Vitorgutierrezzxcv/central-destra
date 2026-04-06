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
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-5 pt-16 pb-20">
        <div className="max-w-lg mx-auto">
          <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">
            Meus Projetos
          </p>
          <h1 className="text-[3.25rem] leading-[1.15] font-extralight tracking-tight mb-4">
            Todos Seus<br />Projetos
          </h1>
          <p className="text-sm text-slate-300 font-light leading-relaxed">
            Acompanhe o progresso, prazos e entregas de cada um dos seus projetos em um só lugar.
          </p>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white px-5 md:px-4 py-12">
        <div className="max-w-lg md:max-w-6xl mx-auto">
        {projects.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-center">
              <Building2 className="w-12 h-12 text-slate-100 mb-4" />
              <p className="text-slate-400 font-light">Nenhum projeto disponível</p>
            </div>
          ) : (
            <div className="space-y-4">
            {projects.map(project => {
              const statusCfg = statusConfig[project.status] || statusConfig.active;
              return (
                <Link
                  key={project.id}
                  to={`${createPageUrl("ClientPortalProject")}?project_id=${project.id}`}
                  className="block bg-white border border-slate-200 rounded-3xl px-6 py-6 hover:shadow-md hover:border-slate-300 transition-all group active:scale-95"
                >
                  {/* Header com badge */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <h2 className="text-xl font-semibold text-slate-900 group-hover:text-slate-700 transition-colors flex-1">{project.name}</h2>
                    <Badge className={`${statusCfg.color} flex-shrink-0`}>{statusCfg.label}</Badge>
                  </div>

                  {/* Fase e descrição */}
                  {project.current_phase && (
                    <p className="text-[11px] text-slate-500 font-medium tracking-wider uppercase mb-2">{project.current_phase}</p>
                  )}
                  {project.description && (
                    <p className="text-sm text-slate-600 font-light leading-relaxed mb-6 line-clamp-2">{project.description}</p>
                  )}

                  {/* Progress bar grande */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-slate-500 font-medium">Progresso</span>
                      <span className="text-2xl font-extralight text-slate-900">{project.progress_percentage || 0}<span className="text-sm text-slate-400">%</span></span>
                    </div>
                    <Progress value={project.progress_percentage || 0} className="h-2.5" />
                  </div>

                  {/* Datas */}
                  <div className="flex items-center gap-5 text-xs text-slate-500 font-light pt-4 border-t border-slate-100">
                    {project.project_start_date && (
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {format(parseISO(project.project_start_date), "dd/MM")}
                      </span>
                    )}
                    {project.estimated_end_date && (
                      <span className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        {format(parseISO(project.estimated_end_date), "dd/MM")}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}