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
            <span className="font-light">{firstName} 👋</span>
          </h1>

          <p className="text-slate-400 text-lg font-light leading-relaxed mb-8">
            Acompanhe o andamento do seu<br className="hidden md:block" /> projeto em tempo real.
          </p>

          {/* Barra fina de progresso */}
          {activeProject && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 font-light">{activeProject.name}</p>
                <p className="text-xs text-slate-500 font-medium">{progress}%</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-[2px]">
                <div
                  className="h-[2px] rounded-full bg-slate-900 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── STATS — caixas dark ── */}
        {activeProject && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { value: completedTasks,  label: "Concluídas" },
              { value: inProgressTasks, label: "Andamento" },
              { value: tasks.length,    label: "Total" },
            ].map((s, i) => (
              <div key={i} className="bg-[#0d1117] rounded-2xl px-5 py-6 flex flex-col">
                <span className="text-4xl font-extralight text-white leading-none">{s.value}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium mt-3">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── ACTION ALERTS ── dark */}
        {pendingApprovals > 0 && (
          <Link
            to={createPageUrl("ClientPortalDeliveries")}
            className="flex items-center justify-between gap-4 bg-[#0d1117] rounded-2xl px-6 py-5 mb-3 group hover:opacity-90 transition-opacity"
          >
            <div>
              <p className="text-white text-sm font-medium">Sua ação é necessária</p>
              <p className="text-white/40 text-xs font-light mt-0.5">
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
            className="flex items-center justify-between gap-4 bg-[#0d1117] rounded-2xl px-6 py-5 mb-4 group hover:opacity-90 transition-opacity"
          >
            <div>
              <p className="text-white text-sm font-medium">Onboarding pendente</p>
              <p className="text-white/40 text-xs font-light mt-0.5">
                {clientOnboarding.length} item{clientOnboarding.length > 1 ? "s" : ""} aguardam sua ação
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </Link>
        )}

        {/* ── PRÓXIMA REUNIÃO ── dark */}
        {upcomingMeetings.length > 0 && (() => {
          const m = upcomingMeetings[0];
          return (
            <div className="bg-[#0d1117] rounded-2xl px-6 py-6 mb-4">
              <p className="text-[10px] text-white/30 tracking-widest uppercase font-medium mb-5">Próxima Reunião</p>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xl font-light text-white leading-none">
                    {format(new Date(m.start_datetime), "dd")}
                  </span>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                    {format(new Date(m.start_datetime), "MMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.title}</p>
                  <p className="text-xs text-white/40 font-light mt-0.5">
                    {format(new Date(m.start_datetime), "HH:mm")} ·{" "}
                    {format(new Date(m.start_datetime), "EEEE", { locale: ptBR })}
                  </p>
                </div>
                {m.meeting_link && (
                  <a href={m.meeting_link} target="_blank" rel="noreferrer"
                    className="flex-shrink-0 px-4 py-2 bg-white text-[#0d1117] rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity">
                    Entrar
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── QUICK LINKS ── borda fina, branco */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          {[
            { label: "Tarefas",    sub: "Progresso das atividades",  page: "ClientPortalTasks",      icon: CheckCircle2 },
            { label: "Entregas",   sub: "Aprovações e revisões",     page: "ClientPortalDeliveries", icon: AlertCircle },
            { label: "Calendário", sub: "Reuniões e datas",          page: "ClientPortalCalendar",   icon: Calendar },
            { label: "Arquivos",   sub: "Documentos do projeto",     page: "ClientPortalFiles",      icon: Star },
            { label: "Suporte",    sub: "Abrir ou ver chamados",     page: "ClientPortalTickets",    icon: MessageSquare },
          ].map((link, i, arr) => (
            <Link
              key={i}
              to={createPageUrl(link.page)}
              className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group ${i < arr.length - 1 ? "border-b border-slate-100" : ""}`}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-100 transition-colors">
                <link.icon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{link.label}</p>
                <p className="text-xs text-slate-400 font-light">{link.sub}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0" />
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