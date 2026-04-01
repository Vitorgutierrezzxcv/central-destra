import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertCircle, Circle, Flag, Target, Zap, Lock } from "lucide-react";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const statusConfig = {
  pending:    { icon: Circle,      color: "text-slate-500",  bg: "bg-slate-500",  label: "Pendente" },
  in_progress:{ icon: Clock,       color: "text-blue-400",   bg: "bg-blue-400",   label: "Em Andamento" },
  completed:  { icon: CheckCircle2,color: "text-emerald-400",bg: "bg-emerald-400",label: "Concluído" },
  blocked:    { icon: AlertCircle, color: "text-rose-400",   bg: "bg-rose-400",   label: "Bloqueado" },
};

const milestoneTypeConfig = {
  kickoff:    { icon: Zap,        color: "from-blue-600 to-blue-800",   label: "Kickoff" },
  review:     { icon: Target,     color: "from-amber-600 to-amber-800", label: "Revisão" },
  delivery:   { icon: Flag,       color: "from-emerald-600 to-emerald-800", label: "Entrega" },
  approval:   { icon: CheckCircle2,color:"from-purple-600 to-purple-800",label: "Aprovação" },
  launch:     { icon: Zap,        color: "from-rose-600 to-rose-800",   label: "Lançamento" },
  other:      { icon: Target,     color: "from-slate-600 to-slate-800", label: "Marco" },
};

export default function ClientPortalTimeline() {
  const { user, userLoading, projects, canAccessProject } = useClientPortal();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: milestones = [] } = useQuery({
    queryKey: ["client_milestones", activeProject?.id],
    queryFn: () => base44.entities.ProjectMilestone.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))
  });

  const { data: events = [] } = useQuery({
    queryKey: ["client_timeline_events", activeProject?.id],
    queryFn: () => base44.entities.ProjectTimelineEvent.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(b.event_date || b.created_date) - new Date(a.event_date || a.created_date))
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["client_timeline_tasks", activeProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === "completed").length;
  const totalMilestones = milestones.length;
  const projectProgress = activeProject?.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Timeline do Projeto</h1>
          {activeProject && (
            <p className="text-slate-400 text-sm mt-1">{activeProject.name} · {activeProject.current_phase || "Em andamento"}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {!activeProject ? (
          <div className="text-center py-20 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {/* Overall Progress */}
            <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-white">{activeProject.name}</h2>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {completedMilestones} de {totalMilestones} marcos concluídos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-400">{projectProgress}%</p>
                  <p className="text-xs text-slate-500">concluído</p>
                </div>
              </div>
              <Progress value={projectProgress} className="h-2.5 bg-white/10" />

              {/* Phase indicators */}
              {milestones.length > 0 && (
                <div className="mt-4 flex gap-1 flex-wrap">
                  {milestones.map((m, i) => {
                    const cfg = statusConfig[m.status] || statusConfig.pending;
                    return (
                      <div key={m.id} className="group relative">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.bg} opacity-80`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Milestones Timeline */}
            {milestones.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-5">Marcos do Projeto</h2>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-white/5" />

                  <div className="space-y-4">
                    {milestones.map((milestone, idx) => {
                      const cfg = statusConfig[milestone.status] || statusConfig.pending;
                      const typeCfg = milestoneTypeConfig[milestone.milestone_type] || milestoneTypeConfig.other;
                      const Icon = cfg.icon;
                      const TypeIcon = typeCfg.icon;
                      const isOverdue = milestone.due_date && isBefore(parseISO(milestone.due_date), new Date()) && milestone.status !== "completed";

                      return (
                        <div key={milestone.id} className="relative flex gap-5">
                          {/* Node */}
                          <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2
                            ${milestone.status === "completed"
                              ? "bg-emerald-500/10 border-emerald-500/50"
                              : milestone.status === "in_progress"
                              ? "bg-blue-500/10 border-blue-500/50"
                              : "bg-white/5 border-white/10"
                            }`}>
                            <Icon className={`w-5 h-5 ${cfg.color}`} />
                          </div>

                          {/* Content */}
                          <div className={`flex-1 bg-[#0D1221] border rounded-2xl p-5 transition-all
                            ${milestone.status === "completed" ? "border-emerald-500/20" :
                              milestone.status === "in_progress" ? "border-blue-500/20" :
                              isOverdue ? "border-rose-500/20" : "border-white/5"}`}>
                            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={`text-xs bg-gradient-to-r ${typeCfg.color} text-white border-0`}>
                                    <TypeIcon className="w-3 h-3 mr-1" />
                                    {typeCfg.label}
                                  </Badge>
                                  {isOverdue && (
                                    <Badge className="text-xs bg-rose-500/20 text-rose-300 border-rose-500/30">Atrasado</Badge>
                                  )}
                                </div>
                                <h3 className="font-semibold text-white">{milestone.title}</h3>
                              </div>
                              <Badge className={`text-xs ${
                                milestone.status === "completed" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                                milestone.status === "in_progress" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                                "bg-slate-500/20 text-slate-300 border-slate-500/30"
                              }`}>
                                {cfg.label}
                              </Badge>
                            </div>

                            {milestone.description && (
                              <p className="text-sm text-slate-400 mb-3">{milestone.description}</p>
                            )}

                            <div className="flex items-center gap-4 flex-wrap">
                              {milestone.due_date && (
                                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                  <Flag className="w-3 h-3" />
                                  Prazo: {format(parseISO(milestone.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </span>
                              )}
                              {milestone.completed_at && milestone.status === "completed" && (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Concluído em {format(parseISO(milestone.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {events.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-5">Atividade Recente</h2>
                <div className="space-y-3">
                  {events.slice(0, 10).map(event => (
                    <div key={event.id} className="bg-[#0D1221] border border-white/5 rounded-xl p-4 flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{event.title}</p>
                        {event.description && <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>}
                      </div>
                      {event.event_date && (
                        <p className="text-xs text-slate-500 flex-shrink-0">
                          {format(new Date(event.event_date || event.created_date), "dd/MM", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {milestones.length === 0 && events.length === 0 && (
              <div className="text-center py-20 text-slate-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum marco ou atividade definida ainda.</p>
                <p className="text-sm mt-1">A equipe Destra atualizará a timeline em breve.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}