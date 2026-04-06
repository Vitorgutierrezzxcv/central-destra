import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, CheckCircle2, Clock, Calendar, AlertCircle, ArrowRight, Star, Loader2, MessageSquare } from "lucide-react";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
            <span className="text-white text-sm font-light">D</span>
          </div>
          <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* ── Hero Header ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-8 md:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between gap-4">
            <div>
              {company && (
                <div className="flex items-center gap-2 mb-3">
                  {company.logo_url && (
                    <img src={company.logo_url} alt={company.name} className="w-5 h-5 rounded object-cover opacity-70" />
                  )}
                  <span className="text-[10px] text-slate-400 tracking-widest uppercase font-medium">{company.name}</span>
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-extralight text-slate-900 tracking-tight">
                Olá, {user?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "Cliente"}
              </h1>
              <p className="text-slate-400 text-sm mt-1.5 font-light">
                Acompanhe o progresso do seu projeto em tempo real.
              </p>
            </div>
            {activeProject && (
              <div className="hidden md:block text-right">
                <p className="text-[10px] text-slate-400 tracking-wider uppercase">{activeProject.current_phase || "Em andamento"}</p>
                <p className="text-lg font-light text-slate-700 mt-0.5">{activeProject.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 md:px-10 py-8 space-y-8">
        {!activeProject ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <Clock className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-slate-600 font-light text-lg mb-2">Nenhum projeto disponível</h3>
            <p className="text-slate-400 text-sm font-light max-w-xs leading-relaxed">
              Entre em contato com a equipe Destra para ter acesso ao seu projeto.
            </p>
          </div>
        ) : (
          <>
            {/* ── Progress Card ── */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-medium text-slate-900">{activeProject.name}</h2>
                  <p className="text-sm text-slate-400 font-light mt-0.5">{activeProject.current_phase || "Fase em andamento"}</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extralight text-slate-900">{activeProject.progress_percentage || 0}</span>
                  <span className="text-lg text-slate-400 font-light">%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-slate-900 transition-all duration-700"
                  style={{ width: `${activeProject.progress_percentage || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-slate-400 font-light">
                {activeProject.project_start_date && (
                  <span>Início: {format(new Date(activeProject.project_start_date), "dd/MM/yyyy")}</span>
                )}
                {activeProject.estimated_end_date && (
                  <span>Previsão: {format(new Date(activeProject.estimated_end_date), "dd 'de' MMMM", { locale: ptBR })}</span>
                )}
              </div>
              {activeProject.description && (
                <p className="text-sm text-slate-400 font-light mt-5 pt-5 border-t border-slate-50 leading-relaxed">
                  {activeProject.description}
                </p>
              )}
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Progresso", value: `${activeProject?.progress_percentage || 0}%`, icon: TrendingUp },
                { label: "Concluídas", value: completedTasks, icon: CheckCircle2 },
                { label: "Em andamento", value: pendingTasks, icon: Clock },
                { label: "Aguard. aprovação", value: pendingApprovals, icon: AlertCircle },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <stat.icon className="w-4 h-4 text-slate-300 mb-3" />
                  <p className="text-2xl font-extralight text-slate-900">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1 tracking-wide uppercase font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Visual Progress */}
            <ProjectProgressIndicators tasks={tasks} project={activeProject} />

            {/* ── Action Alerts ── */}
            <div className="space-y-3">
              {pendingApprovals > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Sua ação é necessária</p>
                      <p className="text-xs text-slate-400 font-light mt-0.5">
                        {pendingApprovals} entrega{pendingApprovals > 1 ? "s" : ""} aguarda{pendingApprovals > 1 ? "m" : ""} aprovação.
                      </p>
                    </div>
                  </div>
                  <Link to={createPageUrl("ClientPortalDeliveries")}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-colors">
                    Ver <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {clientOnboarding.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Pendências do Onboarding</p>
                      <p className="text-xs text-slate-400 font-light mt-0.5">
                        {clientOnboarding.length} item{clientOnboarding.length > 1 ? "s" : ""} aguardam sua ação.
                      </p>
                    </div>
                  </div>
                  <Link to={createPageUrl("ClientPortalOnboarding")}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-colors">
                    Ver <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* ── Grid: Meetings + Quick Links ── */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Upcoming Meetings */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <p className="text-[10px] text-slate-400 tracking-widest uppercase font-medium mb-5">Próximas Reuniões</p>
                {upcomingMeetings.length === 0 ? (
                  <div className="py-8 text-center">
                    <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 font-light">Nenhuma reunião agendada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.slice(0, 3).map(m => (
                      <div key={m.id} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-slate-700 leading-none">
                            {format(new Date(m.start_datetime), "dd")}
                          </span>
                          <span className="text-[8px] text-slate-400 uppercase tracking-wide mt-0.5">
                            {format(new Date(m.start_datetime), "MMM", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 truncate font-medium">{m.title}</p>
                          <p className="text-xs text-slate-400 font-light mt-0.5">{format(new Date(m.start_datetime), "HH:mm")}</p>
                        </div>
                        {m.meeting_link && (
                          <a href={m.meeting_link} target="_blank" rel="noreferrer"
                            className="text-xs text-slate-900 hover:text-slate-600 font-medium flex-shrink-0 flex items-center gap-1">
                            Entrar <ArrowRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <p className="text-[10px] text-slate-400 tracking-widest uppercase font-medium mb-5">Acesso Rápido</p>
                <div className="space-y-0.5">
                  {[
                    { label: "Tarefas & Progresso", page: "ClientPortalTasks", icon: CheckCircle2 },
                    { label: "Entregas para Aprovar", page: "ClientPortalDeliveries", icon: AlertCircle },
                    { label: "Calendário", page: "ClientPortalCalendar", icon: Calendar },
                    { label: "Arquivos", page: "ClientPortalFiles", icon: Star },
                    { label: "Chamados de Suporte", page: "ClientPortalTickets", icon: MessageSquare },
                  ].map((link, i) => (
                    <Link key={i} to={createPageUrl(link.page)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                      <link.icon className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors font-light flex-1">{link.label}</span>
                      <ArrowRight className="w-3 h-3 text-slate-200 group-hover:text-slate-400 transition-all group-hover:translate-x-0.5" />
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