import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Clock, Calendar,
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 md:px-8 pt-12 pb-36">

        {/* ── HERO ── fora de qualquer caixa */}
        <div className="mb-10">
          {company && (
            <p className="text-[10px] text-slate-400 tracking-widest uppercase font-medium mb-4">
              {company.name}
            </p>
          )}

          <h1 className="text-5xl md:text-6xl font-extralight text-slate-900 tracking-tight leading-tight mb-4">
            Olá,<br />
            <span className="font-light">{firstName}</span>
          </h1>

          <p className="text-slate-400 text-base font-light leading-relaxed mb-8">
            Acompanhe o andamento do seu projeto em tempo real.
          </p>

          {/* Progresso em destaque dark */}
          {activeProject && (
            <div className="bg-[#0d1117] rounded-2xl px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/40 font-light truncate pr-4">{activeProject.name}</p>
                <span className="text-2xl font-extralight text-white flex-shrink-0">{progress}<span className="text-sm text-white/40 ml-0.5">%</span></span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-[2px]">
                <div
                  className="h-[2px] rounded-full bg-white transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── STATS ── 3 colunas, alternando dark / branco */}
        {activeProject && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-[#0d1117] rounded-2xl p-4 flex flex-col items-start">
              <span className="text-3xl font-extralight text-white leading-none">{completedTasks}</span>
              <span className="text-[9px] text-white/40 uppercase tracking-widest font-medium mt-2.5">Concluídas</span>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-start">
              <span className="text-3xl font-extralight text-slate-900 leading-none">{inProgressTasks}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-medium mt-2.5">Andamento</span>
            </div>
            <div className="bg-[#0d1117] rounded-2xl p-4 flex flex-col items-start">
              <span className="text-3xl font-extralight text-white leading-none">{tasks.length}</span>
              <span className="text-[9px] text-white/40 uppercase tracking-widest font-medium mt-2.5">Total</span>
            </div>
          </div>
        )}

        {/* ── ALERTS ── */}
        {pendingApprovals > 0 && (
          <Link
            to={createPageUrl("ClientPortalDeliveries")}
            className="flex items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-4 mb-3 group active:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">Ação necessária</p>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                {pendingApprovals} entrega{pendingApprovals > 1 ? "s" : ""} aguarda{pendingApprovals > 1 ? "m" : ""} aprovação
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
          </Link>
        )}

        {clientOnboarding.length > 0 && (
          <Link
            to={createPageUrl("ClientPortalOnboarding")}
            className="flex items-center justify-between gap-3 bg-[#0d1117] rounded-2xl px-5 py-4 mb-3 group active:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Onboarding pendente</p>
              <p className="text-xs text-white/40 font-light mt-0.5">
                {clientOnboarding.length} item{clientOnboarding.length > 1 ? "s" : ""} aguardam sua ação
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 flex-shrink-0" />
          </Link>
        )}

        {/* ── PRÓXIMA REUNIÃO ── branco */}
        {upcomingMeetings.length > 0 && (() => {
          const m = upcomingMeetings[0];
          return (
            <div className="bg-white border border-slate-100 rounded-2xl px-5 py-5 mb-3">
              <p className="text-[9px] text-slate-400 tracking-widest uppercase font-medium mb-4">Próxima Reunião</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0d1117] flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-base font-light text-white leading-none">
                    {format(new Date(m.start_datetime), "dd")}
                  </span>
                  <span className="text-[8px] text-white/40 uppercase tracking-widest mt-0.5">
                    {format(new Date(m.start_datetime), "MMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{m.title}</p>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    {format(new Date(m.start_datetime), "HH:mm")} · {format(new Date(m.start_datetime), "EEE", { locale: ptBR })}
                  </p>
                </div>
                {m.meeting_link && (
                  <a href={m.meeting_link} target="_blank" rel="noreferrer"
                    className="flex-shrink-0 px-3 py-2 bg-[#0d1117] text-white rounded-xl text-xs font-medium active:opacity-80 transition-opacity">
                    Entrar
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── QUICK LINKS ── alternando escuro/claro */}
        <div className="rounded-2xl overflow-hidden border border-slate-100">
          {[
            { label: "Tarefas",    sub: "Progresso das atividades",  page: "ClientPortalTasks",      icon: CheckCircle2, dark: false },
            { label: "Entregas",   sub: "Aprovações e revisões",     page: "ClientPortalDeliveries", icon: AlertCircle,  dark: true  },
            { label: "Calendário", sub: "Reuniões e datas",          page: "ClientPortalCalendar",   icon: Calendar,     dark: false },
            { label: "Arquivos",   sub: "Documentos do projeto",     page: "ClientPortalFiles",      icon: Star,         dark: true  },
            { label: "Suporte",    sub: "Abrir ou ver chamados",     page: "ClientPortalTickets",    icon: MessageSquare,dark: false },
          ].map((link, i, arr) => (
            <Link
              key={i}
              to={createPageUrl(link.page)}
              className={`flex items-center gap-4 px-5 py-4 transition-opacity active:opacity-70
                ${link.dark ? "bg-[#0d1117]" : "bg-white"}
                ${!link.dark && i < arr.length - 1 ? "border-b border-slate-100" : ""}
              `}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${link.dark ? "bg-white/10" : "bg-slate-50"}`}>
                <link.icon className={`w-4 h-4 ${link.dark ? "text-white/60" : "text-slate-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${link.dark ? "text-white" : "text-slate-900"}`}>{link.label}</p>
                <p className={`text-xs font-light mt-0.5 ${link.dark ? "text-white/40" : "text-slate-400"}`}>{link.sub}</p>
              </div>
              <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 ${link.dark ? "text-white/20" : "text-slate-300"}`} />
            </Link>
          ))}
        </div>

        {/* ── NO PROJECT ── */}
        {!activeProject && !userLoading && (
          <div className="py-20 flex flex-col items-center text-center">
            <Clock className="w-8 h-8 text-slate-200 mb-4" />
            <p className="text-slate-500 font-light">Nenhum projeto disponível.</p>
            <p className="text-slate-400 text-sm font-light mt-1 max-w-xs leading-relaxed">
              Entre em contato com a equipe Destra.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}