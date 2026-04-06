import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Building2, TrendingUp, CheckCircle2, Clock, Calendar,
  AlertCircle, ArrowRight, Star, Loader2, Timer, Flame,
  FileText, User, Zap
} from "lucide-react";
import { format, isAfter, differenceInDays, isPast, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

function getApprovalDeadline(task) {
  const ref = task.approval_deadline || (task.completed_at ? addDays(parseISO(task.completed_at), 3).toISOString() : null);
  return ref ? parseISO(ref) : null;
}

function DeadlineLabel({ task }) {
  const deadline = getApprovalDeadline(task);
  if (!deadline) return <span className="text-xs text-amber-600">Aguarda aprovação</span>;

  const daysLeft = differenceInDays(deadline, new Date());
  const expired = isPast(deadline);

  if (expired) return <span className="text-xs text-rose-600 font-medium">Prazo expirado</span>;
  if (daysLeft === 0) return <span className="text-xs text-orange-600 font-semibold flex items-center gap-1"><Flame className="w-3 h-3" />Encerra hoje!</span>;
  if (daysLeft === 1) return <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><Timer className="w-3 h-3" />Falta 1 dia</span>;
  return <span className="text-xs text-amber-600">Faltam {daysLeft} dias</span>;
}

export default function ClientPortalDashboard() {
  const navigate = useNavigate();
  const { user, userLoading, company, projects, canAccessProject } = useClientPortal();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");

  const activeProject = useMemo(() => {
    if (selectedProjectId && canAccessProject(selectedProjectId)) {
      return projects.find(p => p.id === selectedProjectId) || null;
    }
    return projects.find(p => p.status === "active") || projects[0] || null;
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!userLoading && projects.length > 1 && !selectedProjectId) {
      navigate(createPageUrl("ClientPortalProjects"), { replace: true });
    }
  }, [projects.length, userLoading, selectedProjectId]);

  // Busca todas as tarefas do projeto — sem filtro visible_to_client
  const { data: tasks = [] } = useQuery({
    queryKey: ["client_dash_tasks", activeProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["client_dash_meetings", activeProject?.id],
    queryFn: () => base44.entities.ProjectMeeting.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["client_dash_feedbacks", activeProject?.id],
    queryFn: () => base44.entities.DeliveryFeedback.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const { data: onboarding = [] } = useQuery({
    queryKey: ["client_onboarding", activeProject?.id],
    queryFn: () => base44.entities.OnboardingItem.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ["client_deliveries", activeProject?.id],
    queryFn: () => base44.entities.TaskDelivery.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const { data: timelineEvents = [] } = useQuery({
    queryKey: ["client_timeline", activeProject?.id],
    queryFn: () => base44.entities.ProjectTimelineEvent.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const { data: files = [] } = useQuery({
    queryKey: ["client_files", activeProject?.id],
    queryFn: () => base44.entities.ProjectFile.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const mainTasks = tasks.filter(t => !t.parent_task_id);
  const completedTasks = mainTasks.filter(t => t.status === "completed").length;
  const inProgressTasks = mainTasks.filter(t => t.status === "in_progress").length;

  // Tarefas concluídas aguardando aprovação (sem feedback ainda)
  const pendingApprovalTasks = mainTasks.filter(t => {
    if (t.status !== "completed") return false;
    const hasFeedback = feedbacks.some(f => f.task_id === t.id);
    return !hasFeedback;
  });

  const upcomingMeetings = meetings.filter(m =>
    m.status === "scheduled" && m.start_datetime && isAfter(new Date(m.start_datetime), new Date())
  ).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

  const clientOnboarding = onboarding.filter(o => o.responsible_side === "client" && o.status !== "completed");

  // Ações pendentes consolidadas
  const pendingActions = [
    ...pendingApprovalTasks.map(t => ({ type: "approval", data: t, title: t.client_facing_title || t.title })),
    ...clientOnboarding.map(o => ({ type: "onboarding", data: o, title: o.title }))
  ].sort((a, b) => new Date(b.data.updated_date || b.data.created_date) - new Date(a.data.updated_date || a.data.created_date));

  // Entregas recentes
  const recentDeliveries = [...deliveries]
    .sort((a, b) => new Date(b.delivery_date || b.created_date) - new Date(a.delivery_date || a.created_date))
    .slice(0, 4);

  // Timeline recente (últimos 5 eventos)
  const recentTimeline = [...timelineEvents]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  // Arquivos recentes
  const recentFiles = [...files]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 4);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const firstName = user?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "Cliente";

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="max-w-lg mx-auto px-5 pt-14 pb-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">
          {company?.name || "Portal"}
        </p>
        <h1 className="text-[3.25rem] leading-[1.1] font-extralight text-slate-900 tracking-tight mb-2">
          Olá,<br />{firstName}
        </h1>
        <p className="text-[0.9rem] text-slate-400 font-light leading-relaxed">
          {activeProject ? `Acompanhe ${activeProject.name}` : "Bem-vindo ao portal do cliente"}
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5 space-y-5 pb-20">
        {!activeProject ? (
          <div className="text-center py-12">
            <Building2 className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-light">Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {/* 1. CARD DE PROGRESSO GERAL */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-6">
              <p className="text-xs opacity-60 uppercase tracking-widest font-medium mb-3">Progresso Geral</p>
              <div className="mb-4">
                <h2 className="text-2xl font-extralight mb-1">{activeProject.name}</h2>
                {activeProject.current_phase && (
                  <p className="text-xs opacity-70">{activeProject.current_phase}</p>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs opacity-70">Progresso</span>
                    <span className="text-3xl font-extralight">{activeProject.progress_percentage || 0}%</span>
                  </div>
                  <Progress value={activeProject.progress_percentage || 0} className="h-1.5 bg-slate-700" />
                </div>
              </div>
              {activeProject.estimated_end_date && (
                <p className="text-xs opacity-60 mt-3 pt-3 border-t border-slate-700">
                  Previsão: {format(new Date(activeProject.estimated_end_date), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              )}
            </div>

            {/* 2. AÇÃO NECESSÁRIA */}
            {pendingActions.length > 0 && (
              <div className="border-l-3 border-blue-500 bg-blue-50 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-4">
                  <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 text-sm">Ação Necessária</h3>
                    <p className="text-xs text-blue-700 mt-0.5">{pendingActions.length} item{pendingActions.length > 1 ? "ns" : ""} dependem da sua ação</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {pendingActions.slice(0, 3).map((action, i) => (
                    <div key={i} className="text-xs text-blue-800 p-2 bg-white/50 rounded border border-blue-100">
                      <span className="font-medium">{action.type === "approval" ? "Aprovação:" : "Onboarding:"}</span> {action.title}
                    </div>
                  ))}
                  {pendingActions.length > 3 && (
                    <p className="text-xs text-blue-600 px-2">+ {pendingActions.length - 3} item{pendingActions.length - 3 > 1 ? "ns" : ""}</p>
                  )}
                </div>
                <Link to={`${createPageUrl("ClientPortalDeliveries")}${activeProject ? `?project_id=${activeProject.id}` : ""}`} className="inline-block mt-3">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1 h-8 text-xs">
                    Revisar <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            )}

            {/* 3. PRÓXIMA REUNIÃO */}
            {upcomingMeetings.length > 0 ? (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <h3 className="font-semibold text-blue-900 text-sm mb-4">Próxima Reunião</h3>
                {(() => {
                  const meeting = upcomingMeetings[0];
                  return (
                    <div className="space-y-2 text-xs">
                      <div className="pb-2 border-b border-blue-200">
                        <p className="text-blue-700 mb-1">Assunto</p>
                        <p className="font-semibold text-blue-900">{meeting.title}</p>
                      </div>
                      <div className="pb-2 border-b border-blue-200">
                        <p className="text-blue-700 mb-1">Data e Hora</p>
                        <p className="font-semibold text-blue-900">
                          {format(new Date(meeting.start_datetime), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {meeting.meeting_link && (
                        <div className="pt-2">
                          <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="inline-block">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-8 text-xs">
                              Entrar na Reunião <ArrowRight className="w-3 h-3" />
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center py-8">
                <Calendar className="w-5 h-5 text-blue-300 mx-auto mb-2" />
                <p className="text-xs text-blue-400">Nenhuma reunião agendada</p>
              </div>
            )}

            {/* 4. ENTREGAS RECENTES */}
            {recentDeliveries.length > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">Entregas Recentes</h3>
                <div className="space-y-3">
                  {recentDeliveries.map((delivery, i) => (
                    <div key={i} className="p-3 bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-xs font-semibold text-slate-900 flex-1">{delivery.title}</h4>
                        {delivery.status && (
                          <Badge className="text-xs bg-slate-200 text-slate-800">{delivery.status}</Badge>
                        )}
                      </div>
                      {delivery.delivery_date && (
                        <p className="text-[11px] text-slate-500">{format(new Date(delivery.delivery_date), "dd/MM/yyyy")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. TIMELINE RESUMIDA */}
            {recentTimeline.length > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">Últimas Atualizações</h3>
                <div className="space-y-3">
                  {recentTimeline.map((event, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-slate-900 font-medium">{event.title}</p>
                        {event.created_date && (
                          <p className="text-slate-500 text-[10px] mt-0.5">
                            {format(new Date(event.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. ARQUIVOS RECENTES */}
            {recentFiles.length > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">Arquivos Recentes</h3>
                <div className="space-y-2">
                  {recentFiles.map((file, i) => (
                    <a key={i} href={file.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{file.file_name || file.title}</p>
                          {file.created_date && (
                            <p className="text-[10px] text-slate-500 mt-0.5">{format(new Date(file.created_date), "dd/MM/yyyy")}</p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Acesso rápido aos principais módulos */}
            <div className="pt-2 space-y-2 border-t border-slate-100">
              {[
                { label: "Tarefas & Aprovações", page: "ClientPortalDeliveries", icon: CheckCircle2 },
                { label: "Timeline Completa", page: "ClientPortalTimeline", icon: TrendingUp },
                { label: "Ver Todos os Arquivos", page: "ClientPortalFiles", icon: FileText },
              ].map((link, i) => (
                <Link key={i} to={createPageUrl(link.page)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                  <link.icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  <span className="text-xs text-slate-700 font-light flex-1">{link.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}