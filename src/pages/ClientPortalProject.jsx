import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, Calendar, TrendingUp, Users, Clock, CheckCircle2, Flag, ArrowRight, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const statusLabels = {
  active: { label: "Em Andamento", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  completed: { label: "Concluído", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  archived: { label: "Arquivado", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

const onboardingStatusLabels = {
  not_started: { label: "Não iniciado", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  in_progress: { label: "Em andamento", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  completed:   { label: "Concluído", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
};

export default function ClientPortalProject() {
  const { user, userLoading, projects, canAccessProject } = useClientPortal();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: milestones = [] } = useQuery({
    queryKey: ["client_project_milestones", activeProject?.id],
    queryFn: () => base44.entities.ProjectMilestone.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["client_project_tasks", activeProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["client_project_meetings", activeProject?.id],
    queryFn: () => base44.entities.ProjectMeeting.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nenhum projeto disponível.</p>
        </div>
      </div>
    );
  }

  const statusCfg = statusLabels[activeProject.status] || statusLabels.active;
  const onboardingCfg = onboardingStatusLabels[activeProject.onboarding_status] || onboardingStatusLabels.not_started;

  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const pendingTasks = tasks.filter(t => t.status !== "completed").length;
  const upcomingMeetings = meetings.filter(m => m.status === "scheduled" && m.start_datetime && new Date(m.start_datetime) > new Date());
  const nextMilestone = milestones.find(m => m.status !== "completed");

  const quickLinks = [
    { label: "Timeline do Projeto", page: "ClientPortalTimeline", icon: TrendingUp, desc: "Marcos e progresso" },
    { label: "Tarefas & Progresso", page: "ClientPortalTasks", icon: CheckCircle2, desc: "Acompanhe as tarefas" },
    { label: "Entregas para Aprovar", page: "ClientPortalDeliveries", icon: Flag, desc: "Revise e aprove" },
    { label: "Calendário", page: "ClientPortalCalendar", icon: Calendar, desc: "Reuniões e datas" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white">{activeProject.name}</h1>
              {activeProject.description && (
                <p className="text-slate-400 text-sm mt-1 max-w-xl">{activeProject.description}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
              {activeProject.service_type && (
                <Badge className="bg-white/5 text-slate-300 border-white/10">{activeProject.service_type}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Progresso", value: `${activeProject.progress_percentage || 0}%`, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Tarefas Concluídas", value: completedTasks, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
            { label: "Em Andamento", value: pendingTasks, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
            { label: "Próximas Reuniões", value: upcomingMeetings.length, icon: Calendar, color: "text-purple-400", bg: "bg-purple-400/10" },
          ].map((s, i) => (
            <div key={i} className="bg-[#0D1221] border border-white/5 rounded-2xl p-5">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white">Progresso Geral</h2>
              <p className="text-sm text-slate-400 mt-0.5">{activeProject.current_phase || "Fase atual não definida"}</p>
            </div>
            <span className="text-3xl font-bold text-blue-400">{activeProject.progress_percentage || 0}%</span>
          </div>
          <Progress value={activeProject.progress_percentage || 0} className="h-3 bg-white/10" />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
            {activeProject.project_start_date && (
              <div>
                <p className="text-xs text-slate-500">Início do Projeto</p>
                <p className="text-sm font-medium text-white">
                  {format(parseISO(activeProject.project_start_date), "dd/MM/yyyy")}
                </p>
              </div>
            )}
            {activeProject.estimated_end_date && (
              <div>
                <p className="text-xs text-slate-500">Previsão de Entrega</p>
                <p className="text-sm font-medium text-white">
                  {format(parseISO(activeProject.estimated_end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500">Onboarding</p>
              <Badge className={`text-xs ${onboardingCfg.color}`}>{onboardingCfg.label}</Badge>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Next Milestone */}
          {nextMilestone && (
            <div className="bg-[#0D1221] border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Flag className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">Próximo Marco</h3>
              </div>
              <p className="text-base font-semibold text-white mb-2">{nextMilestone.title}</p>
              {nextMilestone.description && (
                <p className="text-sm text-slate-400 mb-3">{nextMilestone.description}</p>
              )}
              {nextMilestone.due_date && (
                <p className="text-xs text-blue-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(nextMilestone.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
              <Link to={createPageUrl("ClientPortalTimeline")} className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                Ver timeline completa <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Next Meeting */}
          {upcomingMeetings[0] && (
            <div className="bg-[#0D1221] border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-white text-sm">Próxima Reunião</h3>
              </div>
              <p className="text-base font-semibold text-white mb-2">{upcomingMeetings[0].title}</p>
              {upcomingMeetings[0].start_datetime && (
                <p className="text-xs text-slate-400">
                  {format(new Date(upcomingMeetings[0].start_datetime), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
              {upcomingMeetings[0].meeting_link && (
                <a
                  href={upcomingMeetings[0].meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 hover:bg-purple-600/30 transition-colors"
                >
                  Entrar na reunião
                </a>
              )}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Seções do Projeto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((link, i) => (
              <Link
                key={i}
                to={createPageUrl(link.page)}
                className="flex items-center gap-4 p-4 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <link.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{link.label}</p>
                  <p className="text-xs text-slate-500">{link.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}