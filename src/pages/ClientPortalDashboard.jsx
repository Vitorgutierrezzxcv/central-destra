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
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="max-w-lg mx-auto px-5 pt-14 pb-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">
          {company?.name || "Portal"}
        </p>
        <h1 className="text-[3.25rem] leading-[1.1] font-extralight text-slate-900 tracking-tight mb-2">
          Olá,<br />{firstName} 👋
        </h1>
        <p className="text-[0.9rem] text-slate-400 font-light leading-relaxed">
          {activeProject ? `Acompanhe ${activeProject.name}` : "Bem-vindo ao portal do cliente"}
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5 space-y-6 pb-20">
        {!activeProject ? (
          <div className="text-center py-12">
            <Building2 className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-light">Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {/* Aprovações pendentes */}
            {pendingApprovalTasks.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h2 className="font-semibold text-amber-900">
                      {pendingApprovalTasks.length} entrega{pendingApprovalTasks.length > 1 ? "s" : ""} aguardando aprovação
                    </h2>
                  </div>
                  <div className="space-y-1">
                    {pendingApprovalTasks.slice(0, 3).map(t => (
                      <div key={t.id} className="text-xs text-amber-700">
                        • {t.client_facing_title || t.title}
                      </div>
                    ))}
                    {pendingApprovalTasks.length > 3 && (
                      <p className="text-xs text-amber-600">+ {pendingApprovalTasks.length - 3} outras</p>
                    )}
                  </div>
                </div>
                <Link to={`${createPageUrl("ClientPortalDeliveries")}${activeProject ? `?project_id=${activeProject.id}` : ""}`} className="flex-shrink-0">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1">
                    Ver <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
                </div>
              </div>
            )}

            {/* Stats compactos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Progresso</p>
                <p className="text-2xl font-extralight text-slate-900">{activeProject?.progress_percentage || 0}%</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Concluídas</p>
                <p className="text-2xl font-extralight text-slate-900">{completedTasks}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Em Andamento</p>
                <p className="text-2xl font-extralight text-slate-900">{inProgressTasks}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Aprovações</p>
                <p className="text-2xl font-extralight text-slate-900">{pendingApprovalTasks.length}</p>
              </div>
            </div>

            {/* Projeto */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h2 className="font-semibold text-slate-900 text-sm mb-2">{activeProject.name}</h2>
              {activeProject.current_phase && (
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-3">{activeProject.current_phase}</p>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500">Progresso</span>
                <span className="text-lg font-extralight text-slate-900">{activeProject.progress_percentage || 0}%</span>
              </div>
              <Progress value={activeProject.progress_percentage || 0} className="h-2" />
              {activeProject.description && (
                <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-2">{activeProject.description}</p>
              )}
            </div>

            {/* Reuniões e Quick Links */}
            {upcomingMeetings.length > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Próximas Reuniões</h3>
                </div>
                <div className="space-y-2">
                  {upcomingMeetings.slice(0, 2).map(m => (
                    <Link key={m.id} to={m.meeting_link || "#"} target={m.meeting_link ? "_blank" : undefined} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors text-xs">
                      <span className="text-slate-600 font-light">{format(new Date(m.start_datetime), "dd/MM")}</span>
                      <span className="text-slate-700 truncate">{m.title}</span>
                      {m.meeting_link && <ArrowRight className="w-3 h-3 text-slate-400 ml-auto flex-shrink-0" />}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Links de acesso rápido */}
            <div className="space-y-2">
              {[
                { label: "Tarefas & Aprovações", page: "ClientPortalDeliveries", icon: CheckCircle2 },
                { label: "Timeline", page: "ClientPortalTimeline", icon: TrendingUp },
                { label: "Arquivos", page: "ClientPortalFiles", icon: Star },
                { label: "Avaliação", page: "ClientPortalSatisfaction", icon: Star },
              ].map((link, i) => (
                <Link key={i} to={createPageUrl(link.page)} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-white hover:border-slate-200 transition-all group">
                  <link.icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  <span className="text-sm text-slate-700 font-light flex-1">{link.label}</span>
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