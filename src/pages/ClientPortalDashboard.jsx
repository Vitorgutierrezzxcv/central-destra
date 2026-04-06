import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Building2, TrendingUp, CheckCircle2, Clock, Calendar,
  AlertCircle, ArrowRight, Star, Loader2, Timer, Flame
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

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const firstName = user?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "Cliente";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {company?.logo_url && (
                <img src={company.logo_url} alt={company.name} className="w-5 h-5 rounded object-cover" />
              )}
              <span className="text-xs text-slate-400 uppercase tracking-wider">{company?.name || ""}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Olá, {firstName} 👋</h1>
            <p className="text-slate-500 text-sm mt-0.5">Acompanhe o progresso do seu projeto.</p>
          </div>
          {activeProject && (
            <div className="hidden md:flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-blue-500 font-medium">Projeto Ativo</p>
                <p className="text-sm font-bold text-blue-900">{activeProject.name}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                {activeProject.current_phase || "Em andamento"}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {!activeProject ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold">Nenhum projeto disponível no momento.</p>
            <p className="text-slate-400 text-sm mt-1">Entre em contato com a equipe Destra para ter acesso.</p>
          </div>
        ) : (
          <>
            {/* Urgência: aprovações pendentes em destaque */}
            {pendingApprovalTasks.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-md">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-100 mb-0.5">Ação necessária</p>
                      <h2 className="text-xl font-bold">
                        {pendingApprovalTasks.length} entrega{pendingApprovalTasks.length > 1 ? "s" : ""} aguarda{pendingApprovalTasks.length > 1 ? "m" : ""} aprovação
                      </h2>
                      <div className="mt-2 space-y-1">
                        {pendingApprovalTasks.slice(0, 3).map(t => (
                          <div key={t.id} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-200 flex-shrink-0" />
                            <span className="text-sm text-amber-100 truncate">{t.client_facing_title || t.title}</span>
                            <span className="ml-1 flex-shrink-0"><DeadlineLabel task={t} /></span>
                          </div>
                        ))}
                        {pendingApprovalTasks.length > 3 && (
                          <p className="text-xs text-amber-200">+ {pendingApprovalTasks.length - 3} outras</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link to={`${createPageUrl("ClientPortalDeliveries")}${activeProject ? `?project_id=${activeProject.id}` : ""}`}>
                    <Button className="bg-white text-amber-700 hover:bg-amber-50 font-semibold gap-2 flex-shrink-0">
                      Ver Aprovações <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Progresso", value: `${activeProject?.progress_percentage || 0}%`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                { label: "Concluídas", value: completedTasks, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                { label: "Em Andamento", value: inProgressTasks, icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                { label: "Aguard. Aprovação", value: pendingApprovalTasks.length, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
              ].map((stat, i) => (
                <div key={i} className={`bg-white border ${stat.border} rounded-2xl p-5`}>
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Progress Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">{activeProject.name}</h2>
                  <p className="text-slate-500 text-sm">{activeProject.current_phase || "Em andamento"}</p>
                </div>
                <span className="text-3xl font-bold text-blue-600">{activeProject.progress_percentage || 0}%</span>
              </div>
              <Progress value={activeProject.progress_percentage || 0} className="h-3 rounded-full" />
              <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                {activeProject.project_start_date && (
                  <span>Início: {format(new Date(activeProject.project_start_date), "dd/MM/yyyy")}</span>
                )}
                {activeProject.estimated_end_date && (
                  <span>Previsão: {format(new Date(activeProject.estimated_end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                )}
              </div>
              {activeProject.description && (
                <p className="text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100 leading-relaxed">{activeProject.description}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Próximas Reuniões */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-slate-900">Próximas Reuniões</h3>
                </div>
                {upcomingMeetings.length === 0 ? (
                  <p className="text-slate-400 text-sm">Nenhuma reunião agendada.</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingMeetings.slice(0, 3).map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-700">{format(new Date(m.start_datetime), "dd")}</span>
                          <span className="text-[10px] text-blue-500">{format(new Date(m.start_datetime), "MMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                          <p className="text-xs text-slate-400">{format(new Date(m.start_datetime), "HH:mm")}</p>
                        </div>
                        {m.meeting_link && (
                          <a href={m.meeting_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex-shrink-0">
                            Entrar
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Onboarding ou Acesso Rápido */}
              {clientOnboarding.length > 0 ? (
                <div className="bg-white border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-slate-900">Pendências do Onboarding</h3>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs ml-auto">{clientOnboarding.length}</Badge>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">
                    {clientOnboarding.length} item{clientOnboarding.length > 1 ? "s" : ""} dependem da sua ação.
                  </p>
                  <Link to={createPageUrl("ClientPortalOnboarding")}>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                      Ver Checklist <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-slate-900 mb-4">Acesso Rápido</h3>
                  <div className="space-y-1">
                    {[
                      { label: "Projeto & Roadmap", page: "ClientPortalProject", icon: Building2 },
                      { label: "Tarefas & Aprovações", page: "ClientPortalDeliveries", icon: CheckCircle2 },
                      { label: "Timeline", page: "ClientPortalTimeline", icon: TrendingUp },
                      { label: "Calendário", page: "ClientPortalCalendar", icon: Calendar },
                      { label: "Arquivos", page: "ClientPortalFiles", icon: Star },
                      { label: "Avaliação", page: "ClientPortalSatisfaction", icon: Star },
                    ].map((link, i) => (
                      <Link key={i} to={createPageUrl(link.page)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                        <link.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{link.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}