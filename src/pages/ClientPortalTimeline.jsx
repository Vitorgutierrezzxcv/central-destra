import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, AlertCircle, Circle, Flag, Target,
  Zap, Loader2, Calendar, Video
} from "lucide-react";
import { format, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const taskStatusConfig = {
  pending:     { icon: Circle,       color: "text-slate-400",   bg: "bg-slate-300",   label: "Pendente",     border: "border-slate-200" },
  in_progress: { icon: Clock,        color: "text-blue-500",    bg: "bg-blue-500",    label: "Em Andamento", border: "border-blue-200" },
  completed:   { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500", label: "Concluído",    border: "border-emerald-200" },
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

  // Sem filtros de visibilidade — todos os dados do projeto
  const { data: milestones = [] } = useQuery({
    queryKey: ["client_milestones", activeProject?.id],
    queryFn: () => base44.entities.ProjectMilestone.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(a.due_date || 0) - new Date(b.due_date || 0))
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["client_timeline_tasks", activeProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => d
      .filter(t => !t.parent_task_id)
      .sort((a, b) => new Date(a.end_date || a.start_date || 0) - new Date(b.end_date || b.start_date || 0))
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["client_timeline_meetings", activeProject?.id],
    queryFn: () => base44.entities.ProjectMeeting.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(a.start_datetime || 0) - new Date(b.start_datetime || 0))
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === "completed").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const projectProgress = activeProject?.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-slate-900">Timeline do Projeto</h1>
          {activeProject && (
            <p className="text-slate-500 text-sm mt-1">
              {activeProject.name} · {activeProject.current_phase || "Em andamento"}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {!activeProject ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {/* Progresso Geral */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">{activeProject.name}</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {completedMilestones} de {milestones.length} marcos · {completedTasks} de {tasks.length} tarefas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{projectProgress}%</p>
                  <p className="text-xs text-slate-400">concluído</p>
                </div>
              </div>
              <Progress value={projectProgress} className="h-3" />
              {activeProject.description && (
                <p className="text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100 leading-relaxed">{activeProject.description}</p>
              )}
              {milestones.length > 0 && (
                <div className="mt-4 flex gap-1.5 flex-wrap">
                  {milestones.map(m => {
                    const cfg = taskStatusConfig[m.status] || taskStatusConfig.pending;
                    return <div key={m.id} className={`w-3 h-3 rounded-full ${cfg.bg}`} title={m.title} />;
                  })}
                </div>
              )}
            </div>

            {/* Marcos */}
            {milestones.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-5">Marcos do Projeto</h2>
                <div className="relative">
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200" />
                  <div className="space-y-4">
                    {milestones.map(milestone => {
                      const cfg = taskStatusConfig[milestone.status] || taskStatusConfig.pending;
                      const typeCfg = milestoneTypeConfig[milestone.milestone_type] || milestoneTypeConfig.other;
                      const Icon = cfg.icon;
                      const TypeIcon = typeCfg.icon;
                      const isOverdue = milestone.due_date &&
                        isBefore(parseISO(milestone.due_date), new Date()) &&
                        milestone.status !== "completed";

                      return (
                        <div key={milestone.id} className="relative flex gap-5">
                          <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${
                            milestone.status === "completed" ? "bg-emerald-50 border-emerald-300" :
                            milestone.status === "in_progress" ? "bg-blue-50 border-blue-300" :
                            "bg-white border-slate-200"
                          }`}>
                            <Icon className={`w-5 h-5 ${cfg.color}`} />
                          </div>

                          <div className={`flex-1 bg-white border rounded-2xl p-5 ${
                            milestone.status === "completed" ? "border-emerald-200" :
                            milestone.status === "in_progress" ? "border-blue-200" :
                            isOverdue ? "border-rose-200" : "border-slate-200"
                          }`}>
                            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge className={`text-xs ${typeCfg.color}`}>
                                    <TypeIcon className="w-3 h-3 mr-1" />
                                    {typeCfg.label}
                                  </Badge>
                                  {isOverdue && (
                                    <Badge className="text-xs bg-rose-100 text-rose-700 border-rose-200">Atrasado</Badge>
                                  )}
                                </div>
                                <h3 className="font-semibold text-slate-900">{milestone.title}</h3>
                              </div>
                              <Badge className={`text-xs ${
                                milestone.status === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                milestone.status === "in_progress" ? "bg-blue-100 text-blue-700 border-blue-200" :
                                "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                                {cfg.label}
                              </Badge>
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-slate-500 mb-3">{milestone.description}</p>
                            )}
                            {milestone.due_date && (
                              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Flag className="w-3 h-3" />
                                Prazo: {format(parseISO(milestone.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Reuniões */}
            {meetings.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Reuniões</h2>
                <div className="space-y-2">
                  {meetings.map(m => (
                    <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{m.title}</p>
                        {m.start_datetime && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {format(new Date(m.start_datetime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                        {m.description && <p className="text-xs text-slate-500 mt-1">{m.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`text-xs ${
                          m.status === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          m.status === "cancelled" ? "bg-slate-100 text-slate-500 border-slate-200" :
                          "bg-blue-100 text-blue-700 border-blue-200"
                        }`}>
                          {m.status === "completed" ? "Realizada" : m.status === "cancelled" ? "Cancelada" : "Agendada"}
                        </Badge>
                        {m.meeting_link && m.status !== "completed" && (
                          <a href={m.meeting_link} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 font-medium hover:underline">
                            Entrar
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tarefas */}
            {tasks.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Tarefas do Projeto</h2>
                <div className="space-y-2">
                  {tasks.map(task => {
                    const tStatus = task.status === "completed" ? "completed" :
                                    task.status === "in_progress" ? "in_progress" : "pending";
                    const cfg = taskStatusConfig[tStatus];
                    const Icon = cfg.icon;
                    return (
                      <div key={task.id} className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${cfg.border}`}>
                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{task.client_facing_title || task.title}</p>
                          {task.client_facing_description && (
                            <p className="text-xs text-slate-500 mt-0.5">{task.client_facing_description}</p>
                          )}
                          {task.completion_summary && task.status === "completed" && (
                            <p className="text-xs text-emerald-600 mt-1">{task.completion_summary}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {task.start_date && (
                              <span className="text-xs text-slate-400">
                                Início: {format(new Date(task.start_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                            {task.end_date && (
                              <span className="text-xs text-slate-400">
                                Prazo: {format(new Date(task.end_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={`text-xs flex-shrink-0 ${
                          tStatus === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          tStatus === "in_progress" ? "bg-blue-100 text-blue-700 border-blue-200" :
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {cfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {milestones.length === 0 && tasks.length === 0 && meetings.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-600 font-medium">Nenhuma informação disponível ainda.</p>
                <p className="text-sm text-slate-400 mt-1">A equipe Destra atualizará a timeline em breve.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}