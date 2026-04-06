import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Clock, Calendar, AlertCircle,
  ArrowRight, Star, Loader2, MessageSquare, Paperclip, ChevronRight
} from "lucide-react";
import { format, isAfter, formatDistanceToNow } from "date-fns";
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

  const { data: files = [] } = useQuery({
    queryKey: ["client_files_home", activeProject?.id],
    queryFn: () => base44.entities.ProjectFile.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 3)
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["client_milestones_home", activeProject?.id],
    queryFn: () => base44.entities.ProjectMilestone.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)).slice(0, 4)
  });

  const completedTasks   = tasks.filter(t => t.status === "completed").length;
  const inProgressTasks  = tasks.filter(t => t.status === "in_progress").length;
  const pendingApprovals = deliveries.filter(d => ["delivered", "under_review"].includes(d.status)).length;
  const upcomingMeeting  = meetings.find(m => m.status === "scheduled" && m.start_datetime && isAfter(new Date(m.start_datetime), new Date()));
  const clientOnboarding = onboarding.filter(o => o.responsible_side === "client" && o.status !== "completed");
  const recentDeliveries = deliveries.filter(d => d.status === "approved").slice(0, 3);
  const hasActions       = pendingApprovals > 0 || clientOnboarding.length > 0;
  const progress         = activeProject?.progress_percentage || 0;
  const firstName        = user?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "Cliente";

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 pt-14 pb-36 space-y-3">

        {/* ── 1. HERO TOPO ── */}
        <div className="pb-6">
          {/* Nome empresa */}
          <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-7">
            {company?.name || "Portal do Cliente"}
          </p>

          {/* Saudação grande */}
          <h1 className="text-[3.25rem] leading-[1.1] font-extralight text-slate-900 tracking-tight mb-4">
            Olá,<br />
            <span className="font-light">{firstName}</span>
          </h1>

          {/* Subtítulo leve */}
          <p className="text-[0.9rem] text-slate-400 font-light leading-relaxed">
            Acompanhe o andamento do seu<br />projeto em tempo real.
          </p>
        </div>

        {/* ── 2. CARD DE PROGRESSO ── dark, executivo */}
        {activeProject && (
          <div className="bg-[#0d1117] rounded-2xl px-6 py-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase font-medium mb-1.5">Projeto</p>
                <p className="text-sm text-white font-light leading-snug truncate">{activeProject.name}</p>
                {activeProject.current_phase && (
                  <p className="text-[10px] text-white/30 font-light mt-1">{activeProject.current_phase}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-3xl font-extralight text-white">{progress}</span>
                <span className="text-sm text-white/30 ml-0.5">%</span>
              </div>
            </div>

            {/* Barra */}
            <div className="w-full bg-white/10 rounded-full h-[1.5px] mb-4">
              <div
                className="h-[1.5px] rounded-full bg-white/70 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Datas */}
            <div className="flex items-center justify-between">
              {activeProject.project_start_date && (
                <p className="text-[10px] text-white/25 font-light">
                  Início {format(new Date(activeProject.project_start_date), "dd/MM/yy")}
                </p>
              )}
              {activeProject.estimated_end_date && (
                <p className="text-[10px] text-white/25 font-light">
                  Previsão {format(new Date(activeProject.estimated_end_date), "dd/MM/yy")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── 3. AÇÕES PENDENTES ── */}
        {hasActions && (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium px-1 mb-3">
              Sua atenção é necessária
            </p>

            {pendingApprovals > 0 && (
              <Link
                to={createPageUrl("ClientPortalDeliveries")}
                className="flex items-center gap-4 bg-[#0d1117] rounded-2xl px-5 py-4 active:opacity-80 transition-opacity"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-white/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Aprovação pendente</p>
                  <p className="text-xs text-white/40 font-light mt-0.5">
                    {pendingApprovals} entrega{pendingApprovals > 1 ? "s" : ""} aguarda{pendingApprovals > 1 ? "m" : ""} sua revisão
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
              </Link>
            )}

            {clientOnboarding.length > 0 && (
              <Link
                to={createPageUrl("ClientPortalOnboarding")}
                className="flex items-center gap-4 border border-slate-100 rounded-2xl px-5 py-4 active:bg-slate-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">Onboarding pendente</p>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    {clientOnboarding.length} item{clientOnboarding.length > 1 ? "s" : ""} aguardam sua ação
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200 flex-shrink-0" />
              </Link>
            )}
          </div>
        )}

        {/* ── 4. VISÃO GERAL ── stats 3 colunas */}
        {activeProject && (
          <div className="pt-2 space-y-2">
            <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium px-1 mb-3">Visão geral</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="border border-slate-100 rounded-2xl p-4">
                <span className="text-2xl font-extralight text-slate-900 leading-none block">{completedTasks}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-medium mt-2 block">Concluídas</span>
              </div>
              <div className="bg-[#0d1117] rounded-2xl p-4">
                <span className="text-2xl font-extralight text-white leading-none block">{inProgressTasks}</span>
                <span className="text-[9px] text-white/30 uppercase tracking-widest font-medium mt-2 block">Andamento</span>
              </div>
              <div className="border border-slate-100 rounded-2xl p-4">
                <span className="text-2xl font-extralight text-slate-900 leading-none block">{tasks.length}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-medium mt-2 block">Total</span>
              </div>
            </div>

            {/* Fase + responsável */}
            {(activeProject.current_phase || activeProject.project_owner_internal) && (
              <div className="border border-slate-100 rounded-2xl px-5 py-4 space-y-3">
                {activeProject.current_phase && (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Fase atual</p>
                    <p className="text-xs text-slate-700 font-light">{activeProject.current_phase}</p>
                  </div>
                )}
                {activeProject.estimated_end_date && (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Previsão</p>
                    <p className="text-xs text-slate-700 font-light">
                      {format(new Date(activeProject.estimated_end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {activeProject.project_owner_internal && (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Responsável</p>
                    <p className="text-xs text-slate-700 font-light">{activeProject.project_owner_internal.split("@")[0]}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 5. PRÓXIMA REUNIÃO ── */}
        {upcomingMeeting && (
          <div className="pt-2">
            <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium px-1 mb-3">Próxima reunião</p>
            <div className="bg-[#0d1117] rounded-2xl px-5 py-5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/8 border border-white/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xl font-light text-white leading-none">
                    {format(new Date(upcomingMeeting.start_datetime), "dd")}
                  </span>
                  <span className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5">
                    {format(new Date(upcomingMeeting.start_datetime), "MMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white leading-snug mb-1">{upcomingMeeting.title}</p>
                  <p className="text-[11px] text-white/40 font-light">
                    {format(new Date(upcomingMeeting.start_datetime), "HH:mm")} &middot;{" "}
                    {format(new Date(upcomingMeeting.start_datetime), "EEEE", { locale: ptBR })}
                  </p>
                </div>
                {upcomingMeeting.meeting_link && (
                  <a href={upcomingMeeting.meeting_link} target="_blank" rel="noreferrer"
                    className="flex-shrink-0 h-9 px-4 bg-white/10 text-white rounded-xl text-xs font-medium flex items-center hover:bg-white/20 transition-colors">
                    Entrar
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 6. ENTREGAS RECENTES ── */}
        {recentDeliveries.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium">Entregas recentes</p>
              <Link to={createPageUrl("ClientPortalDeliveries")} className="text-[10px] text-slate-400 hover:text-slate-700 font-medium transition-colors">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-2">
              {recentDeliveries.map(d => (
                <div key={d.id} className="flex items-center gap-4 border border-slate-100 rounded-2xl px-5 py-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{d.title}</p>
                    {d.delivery_date && (
                      <p className="text-[10px] text-slate-400 font-light mt-0.5">
                        {format(new Date(d.delivery_date), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                    Aprovado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 7. TIMELINE RESUMIDA ── */}
        {milestones.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium">Timeline</p>
              <Link to={createPageUrl("ClientPortalTimeline")} className="text-[10px] text-slate-400 hover:text-slate-700 font-medium transition-colors">
                Ver completa →
              </Link>
            </div>
            <div className="bg-[#0d1117] rounded-2xl px-5 py-5 space-y-4">
              {milestones.map((m, i) => (
                <div key={m.id} className={`flex items-start gap-4 ${i < milestones.length - 1 ? "pb-4 border-b border-white/[0.06]" : ""}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    m.status === "completed" ? "bg-emerald-400" :
                    m.status === "in_progress" ? "bg-blue-400" : "bg-white/20"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light text-white/80 leading-snug">{m.title}</p>
                    {m.due_date && (
                      <p className="text-[10px] text-white/25 font-light mt-0.5">
                        {format(new Date(m.due_date), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 border ${
                    m.status === "completed" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10" :
                    m.status === "in_progress" ? "text-blue-400 border-blue-400/20 bg-blue-400/10" :
                    "text-white/30 border-white/10 bg-white/5"
                  }`}>
                    {m.status === "completed" ? "Concluído" : m.status === "in_progress" ? "Andamento" : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 8. ARQUIVOS RECENTES ── */}
        {files.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium">Arquivos recentes</p>
              <Link to={createPageUrl("ClientPortalFiles")} className="text-[10px] text-slate-400 hover:text-slate-700 font-medium transition-colors">
                Ver todos →
              </Link>
            </div>
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              {files.map((f, i) => (
                <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer"
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 active:bg-slate-50 transition-colors ${i < files.length - 1 ? "border-b border-slate-100" : ""}`}>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{f.name || f.file_name || "Arquivo"}</p>
                    <p className="text-[10px] text-slate-400 font-light mt-0.5">
                      {f.created_date ? formatDistanceToNow(new Date(f.created_date), { addSuffix: true, locale: ptBR }) : ""}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-200 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── 9. NAVEGAÇÃO RÁPIDA ── */}
        <div className="pt-4">
          <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium px-1 mb-3">Navegar</p>
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            {[
              { label: "Tarefas",    sub: "Progresso das atividades",  page: "ClientPortalTasks",      icon: CheckCircle2 },
              { label: "Entregas",   sub: "Aprovações e revisões",     page: "ClientPortalDeliveries", icon: AlertCircle  },
              { label: "Calendário", sub: "Reuniões e datas",          page: "ClientPortalCalendar",   icon: Calendar     },
              { label: "Arquivos",   sub: "Documentos do projeto",     page: "ClientPortalFiles",      icon: Star         },
              { label: "Suporte",    sub: "Abrir ou ver chamados",     page: "ClientPortalTickets",    icon: MessageSquare},
            ].map((link, i, arr) => (
              <Link key={i} to={createPageUrl(link.page)}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 active:bg-slate-50 transition-colors ${i < arr.length - 1 ? "border-b border-slate-100" : ""}`}>
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <link.icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{link.label}</p>
                  <p className="text-xs text-slate-400 font-light">{link.sub}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-200 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── SEM PROJETO ── */}
        {!activeProject && !userLoading && (
          <div className="py-24 flex flex-col items-center text-center">
            <Clock className="w-7 h-7 text-slate-200 mb-5" />
            <p className="text-slate-500 font-light">Nenhum projeto disponível.</p>
            <p className="text-slate-400 text-sm font-light mt-2 max-w-xs leading-relaxed">
              Entre em contato com a equipe Destra.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}