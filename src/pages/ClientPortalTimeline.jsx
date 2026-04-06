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

            {/* Milestones */}
            {milestones.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 tracking-widest uppercase font-medium mb-4">Marcos do Projeto</p>
                <div className="relative">
                  <div className="absolute left-5 top-5 bottom-5 w-px bg-slate-100" />
                  <div className="space-y-3">
                    {milestones.map((milestone) => {
                      const cfg = taskStatusConfig[milestone.status] || taskStatusConfig.pending;
                      const Icon = cfg.icon;
                      const isOverdue = milestone.due_date && isBefore(parseISO(milestone.due_date), new Date()) && milestone.status !== "completed";
                      return (
                        <div key={milestone.id} className="relative flex gap-4">
                          <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border bg-white
                            ${milestone.status === "completed" ? "border-emerald-200" :
                              milestone.status === "in_progress" ? "border-blue-200" :
                              "border-slate-150"}`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-4 min-w-0">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <h3 className="text-sm font-medium text-slate-900">{milestone.title}</h3>
                                {milestone.description && (
                                  <p className="text-xs text-slate-400 font-light mt-1 leading-relaxed">{milestone.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {milestone.due_date && (
                                    <span className={`text-[10px] font-light ${isOverdue ? "text-rose-400" : "text-slate-400"}`}>
                                      Prazo: {format(parseISO(milestone.due_date), "dd/MM/yyyy")}
                                    </span>
                                  )}
                                  {isOverdue && <span className="text-[10px] text-rose-500 font-medium">Atrasado</span>}
                                </div>
                              </div>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${
                                milestone.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                milestone.status === "in_progress" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                "bg-slate-50 text-slate-500 border-slate-200"
                              }`}>{cfg.label}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Meetings */}
             {meetings.length > 0 && (
               <div className="bg-[#001A3D] rounded-2xl p-6">
                 <p className="text-[10px] text-slate-300 tracking-widest uppercase font-medium mb-4">Reuniões</p>
                 <div className="space-y-2">
                   {meetings.map(m => (
                     <div key={m.id} className="bg-[#002654] rounded-2xl border border-[#003d7a] p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#003d7a] border border-[#005299] flex flex-col items-center justify-center flex-shrink-0">
                        {m.start_datetime ? (
                          <>
                            <span className="text-xs font-semibold text-slate-100 leading-none">
                              {format(new Date(m.start_datetime), "dd")}
                            </span>
                            <span className="text-[8px] text-slate-400 uppercase tracking-wide mt-0.5">
                              {format(new Date(m.start_datetime), "MMM", { locale: ptBR })}
                            </span>
                          </>
                        ) : <Calendar className="w-3.5 h-3.5 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-100">{m.title}</p>
                        {m.start_datetime && (
                          <p className="text-xs text-slate-400 font-light mt-0.5">{format(new Date(m.start_datetime), "HH:mm")}</p>
                        )}
                        {m.description && <p className="text-xs text-slate-400 font-light mt-1 leading-relaxed">{m.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${
                          m.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          m.status === "cancelled" ? "bg-slate-700 text-slate-300 border-slate-600" :
                          "bg-[#005299] text-slate-100 border-[#007acc]"
                        }`}>
                          {m.status === "completed" ? "Realizada" : m.status === "cancelled" ? "Cancelada" : "Agendada"}
                        </span>
                        {m.meeting_link && m.status !== "completed" && (
                          <a href={m.meeting_link} target="_blank" rel="noreferrer"
                            className="text-xs text-slate-200 font-medium hover:text-white">Entrar →</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            {tasks.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 tracking-widest uppercase font-medium mb-4">Tarefas</p>
                <div className="space-y-2">
                  {tasks.map(task => {
                    const tStatus = task.status === "completed" ? "completed" : task.status === "in_progress" ? "in_progress" : "pending";
                    const cfg = taskStatusConfig[tStatus];
                    const dot = tStatus === "completed" ? "bg-emerald-400" : tStatus === "in_progress" ? "bg-blue-400" : "bg-slate-300";
                    return (
                      <div key={task.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-4">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{task.client_facing_title || task.title}</p>
                          {task.client_facing_description && (
                            <p className="text-xs text-slate-400 font-light mt-0.5 leading-relaxed">{task.client_facing_description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {task.start_date && <span className="text-[10px] text-slate-400 font-light">Início: {format(new Date(task.start_date), "dd/MM/yyyy")}</span>}
                            {task.end_date && <span className="text-[10px] text-slate-400 font-light">Prazo: {format(new Date(task.end_date), "dd/MM/yyyy")}</span>}
                          </div>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${
                          tStatus === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          tStatus === "in_progress" ? "bg-blue-50 text-blue-600 border-blue-100" :
                          "bg-slate-50 text-slate-500 border-slate-200"
                        }`}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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