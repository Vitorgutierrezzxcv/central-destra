import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, TrendingUp, CheckCircle2, Clock, Calendar, AlertCircle, ArrowRight, Star, Loader2 } from "lucide-react";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import ProjectProgressIndicators from "@/components/client-portal/ProjectProgressIndicators";

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

  const { data: tasks = [] } = useQuery({
    queryKey: ["client_tasks", activeProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ["client_deliveries", activeProject?.id],
    queryFn: () => base44.entities.TaskDelivery.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["client_meetings", activeProject?.id],
    queryFn: () => base44.entities.ProjectMeeting.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id
  });

  const { data: onboarding = [] } = useQuery({
    queryKey: ["client_onboarding", activeProject?.id],
    queryFn: () => base44.entities.OnboardingItem.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const pendingTasks = tasks.filter(t => t.status !== "completed").length;
  const pendingApprovals = deliveries.filter(d => ["delivered", "under_review"].includes(d.status)).length;
  const upcomingMeetings = meetings.filter(m =>
    m.status === "scheduled" && m.start_datetime && isAfter(new Date(m.start_datetime), new Date())
  );
  const clientOnboarding = onboarding.filter(o => o.responsible_side === "client" && o.status !== "completed");

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-6 h-6 rounded object-cover" />
              ) : null}
              <span className="text-sm text-slate-500">{company?.name || "Carregando..."}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Olá, {user?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "Cliente"} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Acompanhe o progresso do seu projeto em tempo real.</p>
          </div>
          {activeProject && (
            <div className="hidden md:flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-blue-500">Projeto Ativo</p>
                <p className="text-sm font-semibold text-blue-900">{activeProject.name}</p>
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
            <p className="text-slate-500 font-medium">Nenhum projeto disponível no momento.</p>
            <p className="text-slate-400 text-sm mt-1">Entre em contato com a equipe Destra para ter acesso.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Progresso", value: `${activeProject?.progress_percentage || 0}%`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                { label: "Concluídas", value: completedTasks, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                { label: "Em Andamento", value: pendingTasks, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                { label: "Aguard. Aprovação", value: pendingApprovals, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
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

            {/* Visual Progress Indicators */}
            <ProjectProgressIndicators tasks={tasks} project={activeProject} />

            {/* Progress Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-slate-900 text-lg">{activeProject.name}</h2>
                  <p className="text-slate-500 text-sm">{activeProject.current_phase || "Fase atual não definida"}</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">{activeProject.progress_percentage || 0}%</span>
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
                <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100">{activeProject.description}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Pending Approvals */}
              {pendingApprovals > 0 && (
                <div className="bg-white border border-rose-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <h3 className="font-semibold text-slate-900">Sua ação é necessária</h3>
                    <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-xs ml-auto">{pendingApprovals}</Badge>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">
                    Você tem {pendingApprovals} entrega{pendingApprovals > 1 ? "s" : ""} aguardando sua aprovação.
                  </p>
                  <Link to={createPageUrl("ClientPortalDeliveries")}>
                    <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white gap-2">
                      Ver Entregas <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              )}

              {/* Client Onboarding Pending */}
              {clientOnboarding.length > 0 && (
                <div className="bg-white border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h3 className="font-semibold text-slate-900">Pendências do Onboarding</h3>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs ml-auto">{clientOnboarding.length}</Badge>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">
                    {clientOnboarding.length} item{clientOnboarding.length > 1 ? "s" : ""} dependem de você.
                  </p>
                  <Link to={createPageUrl("ClientPortalOnboarding")}>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                      Ver Checklist <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              )}

              {/* Upcoming Meetings */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-slate-900">Próximas Reuniões</h3>
                </div>
                {upcomingMeetings.length === 0 ? (
                  <p className="text-slate-400 text-sm">Nenhuma reunião agendada.</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.slice(0, 3).map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-700">{format(new Date(m.start_datetime), "dd")}</span>
                          <span className="text-[10px] text-blue-500">{format(new Date(m.start_datetime), "MMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                          <p className="text-xs text-slate-400">{format(new Date(m.start_datetime), "HH:mm")}</p>
                        </div>
                        {m.meeting_link && (
                          <a href={m.meeting_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700 flex-shrink-0 font-medium">
                            Entrar
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Acesso Rápido</h3>
                <div className="space-y-1">
                  {[
                    { label: "Projeto & Roadmap", page: "ClientPortalProject", icon: Building2 },
                    { label: "Tarefas & Progresso", page: "ClientPortalTasks", icon: CheckCircle2 },
                    { label: "Entregas para Aprovar", page: "ClientPortalDeliveries", icon: AlertCircle },
                    { label: "Onboarding", page: "ClientPortalOnboarding", icon: Clock },
                    { label: "Calendário", page: "ClientPortalCalendar", icon: Calendar },
                    { label: "Avaliação", page: "ClientPortalSatisfaction", icon: Star },
                  ].map((link, i) => (
                    <Link key={i} to={createPageUrl(link.page)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <link.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{link.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}