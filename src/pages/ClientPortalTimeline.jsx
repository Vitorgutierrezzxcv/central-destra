import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertCircle, Circle, Flag, Target, Zap, Loader2, Calendar } from "lucide-react";
import { format, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const taskStatusConfig = {
  pending:     { icon: Circle,       color: "text-slate-400",   bg: "bg-slate-300",    label: "Pendente",      border: "border-slate-200" },
  in_progress: { icon: Clock,        color: "text-blue-500",    bg: "bg-blue-500",     label: "Em Andamento",  border: "border-blue-200"  },
  completed:   { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500",  label: "Concluído",     border: "border-emerald-200" },
  blocked:     { icon: AlertCircle,  color: "text-rose-500",    bg: "bg-rose-500",     label: "Bloqueado",     border: "border-rose-200"  },
};

const milestoneTypeConfig = {
  kickoff:    { icon: Zap,          color: "bg-blue-100 text-blue-700 border-blue-200",         label: "Kickoff" },
  review:     { icon: Target,       color: "bg-amber-100 text-amber-700 border-amber-200",      label: "Revisão" },
  delivery:   { icon: Flag,         color: "bg-emerald-100 text-emerald-700 border-emerald-200",label: "Entrega" },
  approval:   { icon: CheckCircle2, color: "bg-purple-100 text-purple-700 border-purple-200",   label: "Aprovação" },
  launch:     { icon: Zap,          color: "bg-rose-100 text-rose-700 border-rose-200",         label: "Lançamento" },
  other:      { icon: Target,       color: "bg-slate-100 text-slate-600 border-slate-200",      label: "Marco" },
};

export default function ClientPortalTimeline() {
  const { userLoading, projects, canAccessProject } = useClientPortal();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: milestones = [] } = useQuery({
    queryKey: ["client_milestones", activeProject?.id],
    queryFn: () => base44.entities.ProjectMilestone.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(a.due_date || 0) - new Date(b.due_date || 0))
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["client_timeline_tasks", activeProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(a.end_date || a.start_date || 0) - new Date(b.end_date || b.start_date || 0))
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["client_timeline_meetings", activeProject?.id],
    queryFn: () => base44.entities.ProjectMeeting.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
      </div>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === "completed").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const projectProgress = activeProject?.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-full w-full px-5 md:px-4 pt-28 md:pt-12 pb-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-7xl md:text-8xl leading-none font-extralight text-slate-900 tracking-tight">
              Timeline
            </h1>
            </div>
            {activeProject && (
            <div className="text-right mb-2">
              <span className="text-2xl font-extralight text-slate-900">{projectProgress}</span>
              <span className="text-sm text-slate-400 font-light">%</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-full w-full px-5 md:px-4 space-y-8 pb-20">
        {!activeProject ? (
          <div className="flex flex-col items-center py-20">
            <Target className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 font-light">Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="flex justify-center">
              <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-slate-900 transition-all duration-700"
                  style={{ width: `${projectProgress}%` }} />
              </div>
            </div>

            {/* Summary */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm text-slate-600 font-light">
              <span className="text-center">{completedMilestones}/{milestones.length} marcos</span>
              <span className="hidden md:inline">•</span>
              <span className="text-center">{completedTasks}/{tasks.length} tarefas</span>
              <span className="hidden md:inline">•</span>
              <span className="text-center"><strong>{projectProgress}%</strong> concluído</span>
            </div>

            {/* Visual Progress Phases */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0 w-full">
              <div className="flex flex-col md:flex-row items-center justify-center w-full relative">
                {/* Background line for desktop */}
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

                {/* Filled line for desktop */}
                <div className="hidden md:block absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-700"
                  style={{ width: `calc((${((projectProgress / 100) * 5)} / 4) * 100%)` }} />

                {/* Vertical line for mobile */}
                <div className="md:hidden absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2 z-0" />
                <div className="md:hidden absolute left-1/2 top-0 w-0.5 bg-emerald-500 -translate-x-1/2 z-0 transition-all duration-700"
                  style={{ height: `calc((${((projectProgress / 100) * 5)} / 4) * 100%)` }} />

                {[
                  { label: "Kickoff", desc: "Alinhamento inicial" },
                  { label: "Planejamento", desc: "Estratégia e roadmap" },
                  { label: "Desenvolvimento", desc: "Execução do projeto" },
                  { label: "Testes", desc: "QA e validação" },
                  { label: "Entrega", desc: "Finalização" }
                ].map((phase, idx) => {
                  const phaseProgress = (projectProgress / 100) * 5;
                  const isCompleted = phaseProgress > idx;
                  const isActive = Math.floor(phaseProgress) === idx;

                  return (
                    <div key={idx} className="flex flex-col md:flex-1 items-center relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all flex-shrink-0 ${
                        isCompleted ? "bg-emerald-500 border-emerald-500 text-white shadow-md" :
                        isActive ? "bg-blue-500 border-blue-500 text-white shadow-md" :
                        "bg-white border-slate-200 text-slate-400"
                      }`}>
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-xs md:text-sm font-semibold text-slate-800">{phase.label}</p>
                        <p className="text-[10px] text-slate-400 font-light mt-1 hidden md:block">{phase.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>



            {milestones.length === 0 && tasks.length === 0 && meetings.length === 0 && (
              <div className="flex flex-col items-center py-20">
                <Target className="w-10 h-10 text-slate-200 mb-4" />
                <p className="text-slate-400 font-light">Nenhum dado de timeline ainda.</p>
                <p className="text-xs text-slate-400 font-light mt-2 text-center">A equipe Destra atualizará em breve.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}