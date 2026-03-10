import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import { Building2, TrendingUp, CheckCircle2, Clock, Calendar, AlertCircle, ArrowRight, Star, FolderKanban } from "lucide-react";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function ClientPortalDashboard() {
  const navigate = useNavigate();
  const { user, userLoading, company, projects, canAccessProject } = useClientPortal();

  // Lê project_id da URL para suporte à seleção de projeto
  const urlParams = new URLSearchParams(window.location.search);
  const urlProjectId = urlParams.get("project_id");

  // Se tem múltiplos projetos e nenhum selecionado, redireciona para a lista
  useEffect(() => {
    if (!userLoading && projects.length > 1 && !urlProjectId) {
      navigate(createPageUrl("ClientPortalProjects"), { replace: true });
    }
  }, [userLoading, projects, urlProjectId]);

  const activeProject = urlProjectId
    ? projects.find(p => p.id === urlProjectId)
    : (projects.find(p => p.status === "active") || projects[0]);

  // Proteção: verificar se o projeto é acessível
  if (!userLoading && urlProjectId && !canAccessProject(urlProjectId)) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-rose-400 mb-4">Você não tem acesso a este projeto.</p>
          <Link to={createPageUrl("ClientPortalProjects")}>
            <Button className="bg-blue-600 text-white">Ver meus projetos</Button>
          </Link>
        </div>
      </div>
    );
  }

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
  const pendingApprovals = deliveries.filter(d => d.status === "delivered" || d.status === "under_review").length;
  const upcomingMeetings = meetings.filter(m => m.status === "scheduled" && m.start_datetime && isAfter(new Date(m.start_datetime), new Date()));
  const clientOnboarding = onboarding.filter(o => o.responsible_side === "client" && o.status !== "completed");

  const stats = [
    { label: "Progresso Geral", value: `${activeProject?.progress_percentage || 0}%`, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Tarefas Concluídas", value: completedTasks, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Em Andamento", value: pendingTasks, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Aguardando Aprovação", value: pendingApprovals, icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-400/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-sm text-slate-400">{company?.name || "Carregando..."}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Olá, {user?.full_name?.split(" ")[0] || "Cliente"} 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">Acompanhe o progresso do seu projeto em tempo real.</p>
          </div>
          {activeProject && (
            <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-slate-400">Projeto Ativo</p>
                <p className="text-sm font-semibold text-white">{activeProject.name}</p>
              </div>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                {activeProject.current_phase || "Em andamento"}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#0D1221] border border-white/5 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {activeProject && (
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-white text-lg">{activeProject.name}</h2>
                <p className="text-slate-400 text-sm">{activeProject.current_phase || "Fase atual não definida"}</p>
              </div>
              {activeProject.estimated_end_date && (
                <div className="text-right">
                  <p className="text-xs text-slate-400">Previsão de entrega</p>
                  <p className="text-sm font-medium text-white">{format(new Date(activeProject.estimated_end_date), "dd 'de' MMMM", { locale: ptBR })}</p>
                </div>
              )}
            </div>
            <Progress value={activeProject.progress_percentage || 0} className="h-2 bg-white/10" />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500">Início</span>
              <span className="text-xs text-blue-400 font-medium">{activeProject.progress_percentage || 0}% concluído</span>
              <span className="text-xs text-slate-500">Fim</span>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          {pendingApprovals > 0 && (
            <div className="bg-[#0D1221] border border-rose-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <h3 className="font-semibold text-white">Sua ação é necessária</h3>
                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-xs ml-auto">{pendingApprovals}</Badge>
              </div>
              <p className="text-slate-400 text-sm mb-4">Você tem {pendingApprovals} entrega{pendingApprovals > 1 ? "s" : ""} aguardando sua aprovação.</p>
              <Link to={createPageUrl("ClientPortalDeliveries")}>
                <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white gap-2">
                  Ver Entregas <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Client Onboarding Pending */}
          {clientOnboarding.length > 0 && (
            <div className="bg-[#0D1221] border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Pendências do Onboarding</h3>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs ml-auto">{clientOnboarding.length}</Badge>
              </div>
              <p className="text-slate-400 text-sm mb-4">{clientOnboarding.length} item{clientOnboarding.length > 1 ? "s" : ""} pendente{clientOnboarding.length > 1 ? "s" : ""} que dependem de você.</p>
              <Link to={createPageUrl("ClientPortalOnboarding")}>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                  Ver Checklist <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Upcoming Meetings */}
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Próximas Reuniões</h3>
            </div>
            {upcomingMeetings.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma reunião agendada.</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.slice(0, 3).map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex flex-col items-center justify-center">
                      <span className="text-xs font-bold text-blue-400">{format(new Date(m.start_datetime), "dd")}</span>
                      <span className="text-[10px] text-blue-300">{format(new Date(m.start_datetime), "MMM", { locale: ptBR })}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{m.title}</p>
                      <p className="text-xs text-slate-400">{format(new Date(m.start_datetime), "HH:mm")}</p>
                    </div>
                    {m.meeting_link && (
                      <a href={m.meeting_link} target="_blank" rel="noreferrer" className="ml-auto text-xs text-blue-400 hover:text-blue-300">Link</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Acesso Rápido</h3>
            <div className="space-y-2">
              {[
                { label: "Projeto & Roadmap", page: "ClientPortalProject", icon: Building2 },
                { label: "Tarefas & Entregas", page: "ClientPortalDeliveries", icon: CheckCircle2 },
                { label: "Onboarding", page: "ClientPortalOnboarding", icon: Clock },
                { label: "Calendário", page: "ClientPortalCalendar", icon: Calendar },
                { label: "Arquivos", page: "ClientPortalFiles", icon: FolderKanban },
                { label: "Avaliação", page: "ClientPortalSatisfaction", icon: Star },
              ].map((link, i) => (
                <Link key={i} to={createPageUrl(link.page)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <link.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{link.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}