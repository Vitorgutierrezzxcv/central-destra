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

      <div className="max-w-full w-full px-5 md:px-4 space-y-6 pb-20">
        {!activeProject ? (
          <div className="flex flex-col items-center py-20">
            <Target className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 font-light">Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1">
              <div className="h-1 rounded-full bg-slate-900 transition-all duration-700"
                style={{ width: `${projectProgress}%` }} />
            </div>

            {/* Summary */}
            <div className="flex items-center gap-6 text-sm text-slate-400 font-light">
              <span>{completedMilestones}/{milestones.length} marcos</span>
              <span>{completedTasks}/{tasks.length} tarefas</span>
            </div>

            {/* Visual Progress Phases */}
            <div className="space-y-3">
              {[
                { label: "Kickoff", order: 0 },
                { label: "Planejamento", order: 1 },
                { label: "Desenvolvimento", order: 2 },
                { label: "Testes", order: 3 },
                { label: "Entrega", order: 4 }
              ].map((phase, idx) => {
                const phaseProgress = (projectProgress / 100) * 5;
                const isCompleted = phaseProgress > phase.order;
                const isActive = Math.floor(phaseProgress) === phase.order;

                return (
                  <div key={phase.order} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all flex-shrink-0 ${
                      isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                      isActive ? "bg-blue-500 border-blue-500 text-white" :
                      "bg-white border-slate-200 text-slate-400"
                    }`}>
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{phase.label}</p>
                    </div>
                  </div>
                );
              })}
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