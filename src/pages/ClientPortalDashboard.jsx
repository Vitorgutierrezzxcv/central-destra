import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Clock, AlertCircle, ArrowRight, Star, Loader2, MessageSquare, Calendar, FileText } from "lucide-react";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

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
  const progress = activeProject?.progress_percentage || 0;
  const firstName = user?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "Cliente";

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">

      {/* ── HERO ── */}
      <div className="bg-[#f8f8f6] px-6 pt-10 pb-8 md:px-10 md:pt-14">
        <div className="max-w-3xl mx-auto">
          {company && (
            <div className="flex items-center gap-2 mb-5">
              {company.logo_url && (
                <img src={company.logo_url} alt={company.name} className="w-5 h-5 rounded object-cover opacity-60" />
              )}
              <span className="text-[10px] text-slate-400 tracking-widest uppercase font-medium">{company.name}</span>
            </div>
          )}

          <h1 className="text-5xl md:text-7xl font-extralight text-slate-900 tracking-tight leading-none mb-5">
            Olá,<br />{firstName}.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-extralight leading-relaxed max-w-sm">
            Acompanhe o progresso do seu projeto em tempo real, aqui mesmo.
          </p>
        </div>
      </div>

      {activeProject ? (
        <div className="max-w-3xl mx-auto px-5 md:px-10 pb-12 space-y-4">

          {/* ── PROGRESS BAR BLOCK (dark) ── */}
          <div className="bg-slate-900 rounded-3xl p-7 md:p-8">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <p className="text-[10px] text-slate-500 tracking-widest uppercase font-medium mb-1.5">
                  {activeProject.current_phase || "Em andamento"}
                </p>
                <p className="text-white font-light text-lg leading-snug">{activeProject.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-5xl font-extralight text-white leading-none">{progress}</span>
                <span className="text-xl text-slate-500 font-light">%</span>
              </div>
            </div>
            {/* Barra fina */}
            <div className="w-full bg-slate-700/50 rounded-full h-px">
              <div
                className="h-px rounded-full bg-white transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-[10px] text-slate-600 font-light">
              {activeProject.project_start_date && (
                <span>{format(new Date(activeProject.project_start_date), "dd/MM/yyyy")}</span>
              )}
              {activeProject.estimated_end_date && (
                <span>Previsão {format(new Date(activeProject.estimated_end_date), "dd 'de' MMMM", { locale: ptBR })}</span>
              )}
            </div>
          </div>

          {/* ── STATS ROW ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-3xl font-extralight text-slate-900 leading-none">{completedTasks}</p>
                <p className="text-[10px] text-slate-400 mt-1.5 tracking-wide uppercase font-medium">Concluídas</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3">
              <Clock className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-3xl font-extralight text-slate-900 leading-none">{pendingTasks}</p>
                <p className="text-[10px] text-slate-400 mt-1.5 tracking-wide uppercase font-medium">Em aberto</p>
              </div>
            </div>
            <div className={`rounded-2xl p-5 flex flex-col gap-3 ${pendingApprovals > 0 ? "bg-slate-900" : "bg-white border border-slate-100"}`}>
              <AlertCircle className={`w-4 h-4 ${pendingApprovals > 0 ? "text-slate-400" : "text-slate-300"}`} />
              <div>
                <p className={`text-3xl font-extralight leading-none ${pendingApprovals > 0 ? "text-white" : "text-slate-900"}`}>{pendingApprovals}</p>
                <p className={`text-[10px] mt-1.5 tracking-wide uppercase font-medium ${pendingApprovals > 0 ? "text-slate-500" : "text-slate-400"}`}>
                  {pendingApprovals > 0 ? "Aguard. você" : "Aprovações"}
                </p>
              </div>
            </div>
          </div>

          {/* ── ACTION ALERTS ── */}
          {pendingApprovals > 0 && (
            <Link to={createPageUrl("ClientPortalDeliveries")}
              className="block bg-slate-900 rounded-2xl p-6 hover:bg-slate-800 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">Sua ação é necessária</p>
                  <p className="text-slate-400 text-xs font-light mt-1">
                    {pendingApprovals} entrega{pendingApprovals > 1 ? "s" : ""} aguarda{pendingApprovals > 1 ? "m" : ""} aprovação.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          )}

          {clientOnboarding.length > 0 && (
            <Link to={createPageUrl("ClientPortalOnboarding")}
              className="block bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900 font-medium text-sm">Pendências de onboarding</p>
                  <p className="text-slate-400 text-xs font-light mt-1">
                    {clientOnboarding.length} item{clientOnboarding.length > 1 ? "s" : ""} aguardam sua ação.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          )}

          {/* ── PRÓXIMA REUNIÃO (dark block) ── */}
          {upcomingMeetings.length > 0 && (
            <div className="bg-slate-900 rounded-3xl p-7">
              <p className="text-[10px] text-slate-500 tracking-widest uppercase font-medium mb-5">Próxima Reunião</p>
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <span className="text-4xl font-extralight text-white leading-none">
                    {format(new Date(upcomingMeetings[0].start_datetime), "dd")}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                    {format(new Date(upcomingMeetings[0].start_datetime), "MMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-white font-light leading-snug">{upcomingMeetings[0].title}</p>
                  <p className="text-slate-500 text-xs font-light mt-1.5">
                    {format(new Date(upcomingMeetings[0].start_datetime), "HH:mm")} · {format(new Date(upcomingMeetings[0].start_datetime), "EEEE", { locale: ptBR })}
                  </p>
                  {upcomingMeetings[0].meeting_link && (
                    <a href={upcomingMeetings[0].meeting_link} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-4 text-xs text-white font-medium px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                      Entrar na reunião <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── QUICK LINKS GRID ── */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Tarefas", sub: `${completedTasks}/${tasks.length} concluídas`, page: "ClientPortalTasks", icon: CheckCircle2, dark: false },
              { label: "Entregas", sub: pendingApprovals > 0 ? `${pendingApprovals} aguardando` : "Aprovações", page: "ClientPortalDeliveries", icon: AlertCircle, dark: pendingApprovals > 0 },
              { label: "Arquivos", sub: "Documentos", page: "ClientPortalFiles", icon: FileText, dark: false },
              { label: "Suporte", sub: "Chamados", page: "ClientPortalTickets", icon: MessageSquare, dark: false },
            ].map((link) => (
              <Link key={link.page} to={createPageUrl(link.page)}
                className={`rounded-2xl p-5 flex flex-col gap-3 group transition-all ${
                  link.dark
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "bg-white border border-slate-100 hover:border-slate-200"
                }`}>
                <link.icon className={`w-4 h-4 ${link.dark ? "text-slate-400" : "text-slate-300"}`} />
                <div>
                  <p className={`text-sm font-medium ${link.dark ? "text-white" : "text-slate-900"}`}>{link.label}</p>
                  <p className={`text-[10px] font-light mt-0.5 ${link.dark ? "text-slate-500" : "text-slate-400"}`}>{link.sub}</p>
                </div>
              </Link>
            ))}
          </div>

        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-5 md:px-10 py-20 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
            <Clock className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-slate-600 font-light text-lg mb-2">Nenhum projeto disponível</h3>
          <p className="text-slate-400 text-sm font-light max-w-xs leading-relaxed">
            Entre em contato com a equipe Destra para ter acesso ao seu projeto.
          </p>
        </div>
      )}
    </div>
  );
}