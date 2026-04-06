import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  TrendingUp, CheckCircle2, Clock, Calendar,
  AlertCircle, ArrowRight, Star, Loader2, MessageSquare
} from "lucide-react";
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
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
  const pendingApprovals = deliveries.filter(d => ["delivered", "under_review"].includes(d.status)).length;
  const upcomingMeetings = meetings.filter(m =>
    m.status === "scheduled" && m.start_datetime && isAfter(new Date(m.start_datetime), new Date())
  );
  const clientOnboarding = onboarding.filter(o => o.responsible_side === "client" && o.status !== "completed");
  const progress = activeProject?.progress_percentage || 0;
  const firstName = user?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "Cliente";

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#f0efe9] flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0efe9]">
      <div className="max-w-2xl mx-auto px-5 md:px-8 pt-10 pb-32 space-y-4">

        {/* ── HERO ── */}
        <div className="bg-[#0d1117] rounded-3xl px-8 pt-10 pb-8 text-white overflow-hidden relative">
          {/* decorative circle */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.03] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/[0.03] pointer-events-none" />

          {company && (
            <p className="text-[10px] text-white/40 tracking-widest uppercase font-medium mb-6">
              {company.name}
            </p>
          )}

          <h1 className="text-4xl md:text-5xl font-extralight leading-tight tracking-tight mb-3">
            Olá,<br />
            <span className="font-light">{firstName}</span>
          </h1>

          <p className="text-white/50 text-base font-light leading-relaxed mb-8">
            Acompanhe o andamento do<br />seu projeto em tempo real.
          </p>

          {activeProject && (
            <div>
              <div className="flex items-end justify-between mb-3">
                <p className="text-xs text-white/40 font-light">{activeProject.name}</p>
                <span className="text-white/80 text-sm font-light">{progress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-[3px]">
                <div
                  className="h-[3px] rounded-full bg-white transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── ACTION ALERTS ── */}
        {pendingApprovals > 0 && (
          <Link
            to={createPageUrl("ClientPortalDeliveries")}
            className="flex items-center justify-between gap-4 bg-[#0d1117] rounded-2xl px-6 py-5 group"
          >
            <div>
              <p className="text-white text-sm font-medium">Sua ação é necessária</p>
              <p className="text-white/50 text-xs font-light mt-0.5">
                {pendingApprovals} entrega{pendingApprovals > 1 ? "s" : ""} aguarda{pendingApprovals > 1 ? "m" : ""} aprovação
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </Link>
        )}

        {clientOnboarding.length > 0 && (
          <Link
            to={createPageUrl("ClientPortalOnboarding")}
            className="flex items-center justify-between gap-4 bg-[#0d1117] rounded-2xl px-6 py-5 group"
          >
            <div>
              <p className="text-white text-sm font-medium">Onboarding pendente</p>
              <p className="text-white/50 text-xs font-light mt-0.5">
                {clientOnboarding.length} item{clientOnboarding.length > 1 ? "s" : ""} aguardam sua ação
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </Link>
        )}

        {/* ── STATS ── */}
        {activeProject && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-5 flex flex-col">
              <span className="text-3xl font-extralight text-slate-900">{completedTasks}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-2">Concluídas</span>
            </div>
            <div className="bg-white rounded-2xl p-5 flex flex-col">
              <span className="text-3xl font-extralight text-slate-900">{inProgressTasks}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-2">Andamento</span>
            </div>
            <div className="bg-white rounded-2xl p-5 flex flex-col">
              <span className="text-3xl font-extralight text-slate-900">{tasks.length}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium mt-2">Total</span>
            </div>
          </div>
        )}

        {/* ── PRÓXIMA REUNIÃO ── */}
        {upcomingMeetings.length > 0 && (
          <div className="bg-white rounded-2xl p-6">
            <p className="text-[10px] text-slate-400 tracking-widest uppercase font-medium mb-5">Próxima Reunião</p>
            {(() => {
              const m = upcomingMeetings[0];
              return (
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#0d1117] flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xl font-light text-white leading-none">
                      {format(new Date(m.start_datetime), "dd")}
                    </span>
                    <span className="text-[9px] text-white/50 uppercase tracking-widest mt-0.5">
                      {format(new Date(m.start_datetime), "MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{m.title}</p>
                    <p className="text-xs text-slate-400 font-light mt-0.5">
                      {format(new Date(m.start_datetime), "HH:mm")} ·{" "}
                      {format(new Date(m.start_datetime), "EEEE", { locale: ptBR })}
                    </p>
                  </div>
                  {m.meeting_link && (
                    <a href={m.meeting_link} target="_blank" rel="noreferrer"
                      className="flex-shrink-0 px-4 py-2 bg-[#0d1117] text-white rounded-xl text-xs font-medium hover:opacity-80 transition-opacity">
                      Entrar
                    </a>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── QUICK LINKS ── */}
        <div className="bg-white rounded-2xl overflow-hidden">
          {[
            { label: "Tarefas",    sub: "Progresso das atividades",    page: "ClientPortalTasks",      icon: CheckCircle2 },
            { label: "Entregas",   sub: "Aprovações e revisões",       page: "ClientPortalDeliveries", icon: AlertCircle },
            { label: "Calendário", sub: "Reuniões e datas",            page: "ClientPortalCalendar",   icon: Calendar },
            { label: "Arquivos",   sub: "Documentos do projeto",       page: "ClientPortalFiles",      icon: Star },
            { label: "Suporte",    sub: "Abrir ou ver chamados",       page: "ClientPortalTickets",    icon: MessageSquare },
          ].map((link, i, arr) => (
            <Link
              key={i}
              to={createPageUrl(link.page)}
              className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group ${i < arr.length - 1 ? "border-b border-slate-50" : ""}`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-100 transition-colors">
                <link.icon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{link.label}</p>
                <p className="text-xs text-slate-400 font-light">{link.sub}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors group-hover:translate-x-0.5 flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* ── NO PROJECT ── */}
        {!activeProject && !userLoading && (
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center">
            <Clock className="w-8 h-8 text-slate-200 mb-4" />
            <p className="text-slate-600 font-light">Nenhum projeto disponível.</p>
            <p className="text-slate-400 text-sm font-light mt-1 max-w-xs leading-relaxed">
              Entre em contato com a equipe Destra para ter acesso ao seu projeto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}