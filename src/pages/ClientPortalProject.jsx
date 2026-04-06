import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, Calendar, TrendingUp, Clock, CheckCircle2, Flag, ArrowRight, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const statusLabels = {
  active:    { label: "Em Andamento", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Concluído",    color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  archived:  { label: "Arquivado",    color: "bg-slate-100 text-slate-600 border-slate-200" },
};

const onboardingStatusLabels = {
  not_started: { label: "Não iniciado", color: "bg-slate-100 text-slate-600 border-slate-200" },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-700 border-blue-200" },
  completed:   { label: "Concluído",    color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

export default function ClientPortalProject() {
  const { userLoading, projects, canAccessProject } = useClientPortal();

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-12 border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum projeto disponível.</p>
        </div>
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
    { label: "Tarefas & Progresso",  page: "ClientPortalTasks",    icon: CheckCircle2, desc: "Acompanhe as tarefas" },
    { label: "Entregas para Aprovar",page: "ClientPortalDeliveries",icon: Flag, desc: "Revise e aprove" },
    { label: "Calendário",           page: "ClientPortalCalendar",  icon: Calendar, desc: "Reuniões e datas" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col md:flex-row">
      {/* Left Panel - Dark */}
      <div className="md:w-5/12 text-white px-5 md:px-8 py-8 md:py-12 flex flex-col justify-between min-h-screen md:min-h-auto">
        <div>
          <p className="text-slate-400 text-[10px] tracking-[0.2em] uppercase font-medium mb-4">Projeto</p>
          <h1 className="text-4xl md:text-5xl font-light leading-tight mb-6 text-white">{activeProject.name}</h1>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-2">Status</p>
              <Badge className={`${statusCfg.color} text-xs`}>{statusCfg.label}</Badge>
            </div>
            {activeProject.project_start_date && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-1">Início</p>
                <p className="text-sm text-slate-200">{format(parseISO(activeProject.project_start_date), "dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
            )}
            {activeProject.estimated_end_date && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-1">Entrega Prevista</p>
                <p className="text-sm text-slate-200">{format(parseISO(activeProject.estimated_end_date), "dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-[10px] text-slate-500 space-y-1">
          <p>© 2026 Destra · Acesso seguro</p>
        </div>
      </div>

      {/* Right Panel - Content */}
      <div className="md:w-7/12 bg-white flex flex-col overflow-y-auto">
        <div className="px-5 md:px-8 py-8 space-y-6 flex-1">
        {/* Progress Card - Blue */}
        <div className="border border-blue-200 bg-blue-50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900">Progresso Geral</h2>
              <p className="text-sm text-slate-500 mt-0.5">{activeProject.current_phase || "Fase atual não definida"}</p>
            </div>
            <span className="text-3xl font-bold text-primary">{activeProject.progress_percentage || 0}%</span>
          </div>
          <Progress value={activeProject.progress_percentage || 0} className="h-3" />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
            {activeProject.project_start_date && (
              <div>
                <p className="text-xs text-slate-400">Início do Projeto</p>
                <p className="text-sm font-medium text-slate-800">
                  {format(parseISO(activeProject.project_start_date), "dd/MM/yyyy")}
                </p>
              </div>
            )}
            {activeProject.estimated_end_date && (
              <div>
                <p className="text-xs text-slate-400">Previsão de Entrega</p>
                <p className="text-sm font-medium text-slate-800">
                  {format(parseISO(activeProject.estimated_end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">Onboarding</p>
              <Badge className={`text-xs mt-1 ${onboardingCfg.color}`}>{onboardingCfg.label}</Badge>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Next Milestone - Blue */}
          {nextMilestone && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Flag className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-slate-900 text-sm">Próximo Marco</h3>
              </div>
              <p className="text-base font-semibold text-slate-900 mb-2">{nextMilestone.title}</p>
              {nextMilestone.description && (
                <p className="text-sm text-slate-500 mb-3">{nextMilestone.description}</p>
              )}
              {nextMilestone.due_date && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(nextMilestone.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
              <Link to={createPageUrl("ClientPortalTimeline")} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium">
                Ver timeline completa <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Next Meeting - White */}
          {upcomingMeetings[0] && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Próxima Reunião</h3>
              </div>
              <p className="text-base font-semibold text-slate-900 mb-2">{upcomingMeetings[0].title}</p>
              {upcomingMeetings[0].start_datetime && (
                <p className="text-xs text-slate-500">
                  {format(new Date(upcomingMeetings[0].start_datetime), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
              {upcomingMeetings[0].meeting_link && (
                <a
                  href={upcomingMeetings[0].meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition-colors"
                >
                  Entrar na reunião
                </a>
              )}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Seções do Projeto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((link, i) => (
              <Link
                key={i}
                to={createPageUrl(link.page)}
                className={`flex items-center gap-4 p-4 border rounded-xl transition-all group ${
                  i % 2 === 0
                    ? "bg-blue-50 border-blue-200 hover:border-blue-300"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                  i % 2 === 0
                    ? "bg-blue-100 border-blue-200"
                    : "bg-slate-100 border-slate-200"
                }`}>
                  <link.icon className={`w-5 h-5 ${i % 2 === 0 ? "text-primary" : "text-slate-600"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{link.label}</p>
                  <p className="text-xs text-slate-400">{link.desc}</p>
                </div>
                <ArrowRight className={`w-4 h-4 transition-colors ${i % 2 === 0 ? "text-primary" : "text-slate-300"}`} />
              </Link>
            ))}
          </div>
        </div>
        </div>
        </div>
        );
        }