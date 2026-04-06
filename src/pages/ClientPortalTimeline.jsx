import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertCircle, Circle, Flag, Target, Zap, Loader2 } from "lucide-react";
import { format, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const statusConfig = {
  pending:     { icon: Circle,       color: "text-slate-400",   bg: "bg-slate-300",    label: "Pendente" },
  in_progress: { icon: Clock,        color: "text-blue-500",    bg: "bg-blue-500",     label: "Em Andamento" },
  completed:   { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500",  label: "Concluído" },
  blocked:     { icon: AlertCircle,  color: "text-rose-500",    bg: "bg-rose-500",     label: "Bloqueado" },
};

const milestoneTypeConfig = {
  kickoff:    { icon: Zap,         color: "bg-blue-100 text-blue-700 border-blue-200",     label: "Kickoff" },
  review:     { icon: Target,      color: "bg-amber-100 text-amber-700 border-amber-200",  label: "Revisão" },
  delivery:   { icon: Flag,        color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Entrega" },
  approval:   { icon: CheckCircle2,color: "bg-purple-100 text-purple-700 border-purple-200", label: "Aprovação" },
  launch:     { icon: Zap,         color: "bg-rose-100 text-rose-700 border-rose-200",     label: "Lançamento" },
  other:      { icon: Target,      color: "bg-slate-100 text-slate-600 border-slate-200",  label: "Marco" },
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

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === "completed").length;
  const projectProgress = activeProject?.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-slate-900">Timeline do Projeto</h1>
          {activeProject && (
            <p className="text-slate-500 text-sm mt-1">{activeProject.name} · {activeProject.current_phase || "Em andamento"}</p>
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
            {/* Overall Progress */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{activeProject.name}</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {completedMilestones} de {milestones.length} marcos concluídos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{projectProgress}%</p>
                  <p className="text-xs text-slate-400">concluído</p>
                </div>
              </div>
              <Progress value={projectProgress} className="h-3" />

              {milestones.length > 0 && (
                <div className="mt-4 flex gap-1.5 flex-wrap">
                  {milestones.map((m) => {
                    const cfg = statusConfig[m.status] || statusConfig.pending;
                    return <div key={m.id} className={`w-3 h-3 rounded-full ${cfg.bg}`} title={m.title} />;
                  })}
                </div>
              )}
            </div>

            {/* Milestones Timeline */}
            {milestones.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-5">Marcos do Projeto</h2>
                <div className="relative">
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200" />
                  <div className="space-y-4">
                    {milestones.map((milestone) => {
                      const cfg = statusConfig[milestone.status] || statusConfig.pending;
                      const typeCfg = milestoneTypeConfig[milestone.milestone_type] || milestoneTypeConfig.other;
                      const Icon = cfg.icon;
                      const TypeIcon = typeCfg.icon;
                      const isOverdue = milestone.due_date && isBefore(parseISO(milestone.due_date), new Date()) && milestone.status !== "completed";

                      return (
                        <div key={milestone.id} className="relative flex gap-5">
                          <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2
                            ${milestone.status === "completed" ? "bg-emerald-50 border-emerald-300" :
                              milestone.status === "in_progress" ? "bg-blue-50 border-blue-300" :
                              "bg-white border-slate-200"}`}>
                            <Icon className={`w-5 h-5 ${cfg.color}`} />
                          </div>

                          <div className={`flex-1 bg-white border rounded-2xl p-5 transition-all ${
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

                            <div className="flex items-center gap-4 flex-wrap">
                              {milestone.due_date && (
                                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                  <Flag className="w-3 h-3" />
                                  Prazo: {format(parseISO(milestone.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </span>
                              )}
                              {milestone.completed_at && milestone.status === "completed" && (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600">
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
                <h2 className="text-lg font-semibold text-slate-900 mb-5">Atividade Recente</h2>
                <div className="space-y-2">
                  {events.slice(0, 10).map(event => (
                    <div key={event.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{event.title}</p>
                        {event.description && <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>}
                      </div>
                      {event.event_date && (
                        <p className="text-xs text-slate-400 flex-shrink-0">
                          {format(new Date(event.event_date || event.created_date), "dd/MM", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {milestones.length === 0 && events.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">Nenhum marco ou atividade definida ainda.</p>
                <p className="text-sm text-slate-400 mt-1">A equipe Destra atualizará a timeline em breve.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}