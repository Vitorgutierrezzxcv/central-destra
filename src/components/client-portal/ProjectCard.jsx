import React from "react";
import { Calendar, ArrowRight, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusConfig = {
  active:    { label: "Em Andamento", color: "bg-slate-700 text-slate-100 border-slate-600" },
  completed: { label: "Concluído",    color: "bg-slate-700 text-slate-100 border-slate-600" },
  archived:  { label: "Arquivado",    color: "bg-slate-700 text-slate-100 border-slate-600" },
};

export default function ProjectCard({ project, financialData }) {
  const statusCfg = statusConfig[project.status] || statusConfig.active;
  const isOverdue = project.estimated_end_date && isPast(new Date(project.estimated_end_date)) && project.status !== "completed";
  const satisfaction = project.satisfaction_score || null;
  
  return (
    <Link
      to={`${createPageUrl("ClientPortalProject")}?project_id=${project.id}`}
      className="block bg-slate-800/50 border border-slate-700 rounded-2xl px-5 md:px-6 py-5 md:py-6 hover:bg-slate-700/50 hover:border-slate-600 transition-all group active:scale-95"
    >
      {/* Header com badge */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-lg md:text-xl font-medium text-white group-hover:text-slate-100 transition-colors flex-1">{project.name}</h2>
        <Badge className={`${statusCfg.color} flex-shrink-0 text-[10px] border`}>{statusCfg.label}</Badge>
      </div>

      {/* Fase e descrição */}
      {project.current_phase && (
        <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mb-3">{project.current_phase}</p>
      )}
      {project.description && (
        <p className="text-xs md:text-sm text-slate-300 font-light leading-relaxed mb-6 line-clamp-2">{project.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-400 font-medium">Progresso</span>
          <span className="text-lg md:text-2xl font-extralight text-white">{project.progress_percentage || 0}<span className="text-xs md:text-sm text-slate-400">%</span></span>
        </div>
        <Progress value={project.progress_percentage || 0} className="h-2" />
      </div>

      {/* Status Cards - Prazo, Financeiro, Satisfação */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Prazo */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">Prazo</p>
          {isOverdue ? (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-400 font-medium">Atrasado</span>
            </div>
          ) : project.estimated_end_date ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-emerald-400 font-medium">No prazo</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>

        {/* Financeiro */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">Financeiro</p>
          {financialData ? (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="text-xs text-blue-300 font-medium">{financialData}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>

        {/* Satisfação */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700">
          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-medium mb-1">Satisfação</p>
          {satisfaction !== null ? (
            <div className="flex items-center gap-1">
              <span className="text-lg font-medium text-amber-400">{satisfaction}</span>
              <span className="text-xs text-amber-300">/5</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>
      </div>

      {/* Datas */}
      <div className="flex items-center gap-5 text-[10px] md:text-xs text-slate-400 font-light pt-4 border-t border-slate-700">
        {project.project_start_date && (
          <span className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {format(parseISO(project.project_start_date), "dd/MM")}
          </span>
        )}
        {project.estimated_end_date && (
          <span className="flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            {format(parseISO(project.estimated_end_date), "dd/MM")}
          </span>
        )}
      </div>
    </Link>
  );
}