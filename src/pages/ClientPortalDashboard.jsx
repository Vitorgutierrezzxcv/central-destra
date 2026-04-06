import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Clock, Calendar, AlertCircle,
  ArrowRight, Star, Loader2, MessageSquare, Paperclip, ChevronRight, Receipt
} from "lucide-react";
import { format, isAfter, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import TaskApprovalModal from "@/components/client-portal/TaskApprovalModal";
import { useToast } from "@/components/ui/use-toast";

export default function ClientPortalDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, userLoading, company, projects, canAccessProject } = useClientPortal();

  const [selectedApprovalTask, setSelectedApprovalTask] = useState(null);

  const submitApproval = useMutation({
    mutationFn: async (data) => {
      // Update task status
      await base44.entities.Task.update(data.taskId, {
        status: data.decision === "approved" ? "completed" : "pending"
      });

      // Create a comment/record if there's feedback
      if (data.feedback.trim()) {
        await base44.entities.TaskComment.create({
          task_id: data.taskId,
          comment: `[${data.decision === "approved" ? "APROVADO" : "REJEITADO"}] ${data.feedback}`,
          is_client_feedback: true
        });
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_tasks"] });
      setSelectedApprovalTask(null);
      toast({
        title: "Sucesso",
        description: "Sua decisão foi registrada e enviada à equipe."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível processar sua aprovação. Tente novamente.",
        variant: "destructive"
      });
    }
  });

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

  const { data: timelineEvents = [] } = useQuery({
    queryKey: ["client_timeline_events", activeProject?.id],
    queryFn: () => base44.entities.ProjectTimelineEvent.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5)
  });

  const completedTasks      = tasks.filter(t => t.status === "completed").length;
  const inProgressTasks     = tasks.filter(t => t.status === "in_progress").length;
  const pendingApprovals    = deliveries.filter(d => ["delivered", "under_review"].includes(d.status)).length;
  const pendingApprovalTasks = tasks.filter(t => t.approval_required && t.status !== 'completed');
  const upcomingMeeting     = meetings.find(m => m.status === "scheduled" && m.start_datetime && isAfter(new Date(m.start_datetime), new Date()));
  const clientOnboarding    = onboarding.filter(o => o.responsible_side === "client" && o.status !== "completed");
  const recentDeliveries    = deliveries.filter(d => d.status === "approved").slice(0, 3);
  const hasActions          = pendingApprovals > 0 || clientOnboarding.length > 0;
  const progress            = activeProject?.progress_percentage || 0;
  const firstName           = user?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "Cliente";

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg md:max-w-6xl mx-auto px-5 md:px-4 pt-28 md:pt-12 pb-36 space-y-4">

        {/* ── 1. HERO TOPO ── */}
        <div className="pb-6">
          {/* Nome empresa */}
             <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-8">
               {company?.name || "Portal do Cliente"}
             </p>

          {/* Saudação grande */}
          <h1 className="text-4xl md:text-[3.25rem] leading-[1.1] font-extralight text-slate-900 tracking-tight mb-4">
            Olá,<br />
            <span className="font-light">{firstName}</span>
          </h1>

          {/* Subtítulo leve */}
          <p className="text-lg md:text-[0.9rem] text-slate-400 font-light leading-relaxed">
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

        {/* ── 3. AÇÃO NECESSÁRIA (DESTAQUE) ── */}
        {hasActions && (
          <div className="pt-4 space-y-3">
            <div className="border-b border-slate-100 pb-4">
              <p className="text-[10px] tracking-[0.15em] uppercase text-rose-600 font-bold px-1 mb-4">
                ⚠ Ação Necessária
              </p>

              {pendingApprovals > 0 && (
                <Link
                  to={createPageUrl("ClientPortalDeliveries")}
                  className="flex items-center gap-4 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-4 active:opacity-80 transition-opacity mb-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-rose-700">Entregas com aprovação pendente</p>
                    <p className="text-xs text-rose-600 font-light mt-1">
                      {pendingApprovals} entrega{pendingApprovals > 1 ? "s" : ""} aguarda{pendingApprovals > 1 ? "m" : ""} sua revisão e decisão
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-200 flex-shrink-0" />
                </Link>
              )}

              {clientOnboarding.length > 0 && (
                <Link
                  to={createPageUrl("ClientPortalOnboarding")}
                  className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 active:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-700">Onboarding pendente</p>
                    <p className="text-xs text-amber-600 font-light mt-1">
                      {clientOnboarding.length} item{clientOnboarding.length > 1 ? "s" : ""} aguardam sua ação para continuarmos
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-200 flex-shrink-0" />
                </Link>
              )}
            </div>
          </div>
        )}



        {/* ── 4. TAREFAS PENDENTES DE APROVAÇÃO ── */}
        {pendingApprovalTasks.length > 0 && (
          <div className="pt-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium">Tarefas pendentes de aprovação</p>
              <Link to={createPageUrl("ClientPortalDeliveries")} className="text-[10px] text-slate-400 hover:text-slate-700 font-medium transition-colors">
                Ver tudo →
              </Link>
            </div>
            <div className="space-y-2">
              {pendingApprovalTasks.slice(0, 3).map(task => (
                <button
                  key={task.id}
                  onClick={() => setSelectedApprovalTask(task)}
                  className="w-full text-left block border border-primary/20 bg-primary/5 rounded-2xl px-4 py-3 hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-light text-slate-900 leading-snug">{task.client_facing_title || task.title}</p>
                      {task.delivery_date && (
                        <p className="text-[10px] text-slate-500 font-light mt-1">
                          Entrega: {format(new Date(task.delivery_date), "dd/MM/yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. PRÓXIMA REUNIÃO ── */}
        <div className="pt-3">
          <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium px-1 mb-3">Próxima reunião</p>
          {upcomingMeeting ? (
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
                  {upcomingMeeting.description && (
                    <p className="text-[10px] text-white/25 font-light mt-2 leading-snug">{upcomingMeeting.description}</p>
                  )}
                </div>
                {upcomingMeeting.meeting_link && (
                  <a href={upcomingMeeting.meeting_link} target="_blank" rel="noreferrer"
                    className="flex-shrink-0 h-9 px-4 bg-white/10 text-white rounded-xl text-xs font-medium flex items-center hover:bg-white/20 transition-colors">
                    Entrar
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-slate-100 rounded-2xl px-5 py-8 text-center">
              <Calendar className="w-6 h-6 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-light">Nenhuma reunião agendada no momento.</p>
            </div>
          )}
        </div>

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
        <div className="pt-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium">Timeline de eventos</p>
            {milestones.length > 0 && (
              <Link to={createPageUrl("ClientPortalTimeline")} className="text-[10px] text-slate-400 hover:text-slate-700 font-medium transition-colors">
                Ver completa →
              </Link>
            )}
          </div>
          {timelineEvents.length > 0 ? (
            <div className="bg-[#0d1117] rounded-2xl px-5 py-5 space-y-4">
              {timelineEvents.map((event, i) => (
                <div key={event.id} className={`flex items-start gap-4 ${i < timelineEvents.length - 1 ? "pb-4 border-b border-white/[0.06]" : ""}`}>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                    event.event_type === "task_completed" ? "bg-emerald-400" :
                    event.event_type === "delivery_sent" ? "bg-blue-400" :
                    event.event_type === "meeting" ? "bg-purple-400" :
                    event.event_type === "feedback" ? "bg-amber-400" : "bg-white/20"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light text-white/80 leading-snug">{event.title || event.description}</p>
                    <p className="text-[10px] text-white/25 font-light mt-0.5">
                      {formatDistanceToNow(new Date(event.created_date), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-slate-100 rounded-2xl px-5 py-8 text-center">
              <Clock className="w-6 h-6 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-light">Sem eventos ainda na timeline.</p>
            </div>
          )}
        </div>

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
        <div className="pt-6">
          <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 font-medium px-1 mb-3">Mais opções</p>
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            {[
              { label: "Tarefas",    sub: "Progresso das atividades",  page: "ClientPortalTasks",      icon: CheckCircle2 },
              { label: "Entregas",   sub: "Aprovações e revisões",     page: "ClientPortalDeliveries", icon: AlertCircle  },
              { label: "Calendário", sub: "Reuniões e datas",          page: "ClientPortalCalendar",   icon: Calendar     },
              { label: "Arquivos",   sub: "Documentos do projeto",     page: "ClientPortalFiles",      icon: Star         },
              { label: "Financeiro", sub: "Faturas e contratos",        page: "ClientPortalFinancial",  icon: Receipt      },
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

      {/* Modal de Aprovação */}
      {selectedApprovalTask && (
        <TaskApprovalModal
          task={selectedApprovalTask}
          onClose={() => setSelectedApprovalTask(null)}
          onSubmit={(data) => submitApproval.mutate(data)}
        />
      )}
    </div>
  );
}