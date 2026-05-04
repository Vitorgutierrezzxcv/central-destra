import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { isBefore, isSameDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Calendar, ArrowRight } from "lucide-react";

import GoogleCalendarWidget from "../components/dashboard/GoogleCalendarWidget";
import NotesBlock from "../components/dashboard/NotesBlock";
import StatsCards from "../components/dashboard/StatsCards";
import ProjectProgress from "../components/dashboard/ProjectProgress";
import UpcomingTasks from "../components/dashboard/UpcomingTasks";
import UserPerformanceRanking from "../components/dashboard/UserPerformanceRanking";
import AccessGuard from "../components/layout/AccessGuard";
import PomodoroTimer from "../components/dashboard/PomodoroTimer";
import TaskProgressWidget from "../components/dashboard/TaskProgressWidget";
import PersonalTasksBlock from "../components/dashboard/PersonalTasksBlock";

function DashboardContent() {
  const [selectedDate, setSelectedDate] = useState(new Date()); // kept for compatibility

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['my-tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ assigned_to: user.email }),
    enabled: !!user
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  if (loadingUser || loadingTasks || loadingProjects) {
    return (
      <div className="min-h-screen bg-white px-4 py-4 md:px-6 lg:px-8">
        <div className="max-w-full space-y-4">
          <Skeleton className="h-10 w-48 rounded-lg mt-8" />
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>);

  }

  const now = new Date();
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    if (!t.end_date) return false;
    return isBefore(new Date(t.end_date), now) && !isSameDay(new Date(t.end_date), now);
  }).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const displayName = user?.display_name || user?.full_name?.split(' ')[0] || 'Usuário';

  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const totalTasksCount = tasks.length;

  return (
    <div className="min-h-screen bg-white px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6 overflow-x-hidden">
      <div className="w-full max-w-full">

        {/* ── Page Header ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-slate-500 text-xl sm:text-2xl font-light normal-case tracking-wider">{greeting()}</p>
            <h1 className="text-slate-900 text-3xl sm:text-4xl font-light tracking-tight leading-tight">
              {displayName}
            </h1>
            <p className="text-slate-500 mb-1 text-sm font-light capitalize">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Link to={createPageUrl("Projects")}>
              <Button variant="outline" size="sm" className="h-9 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 font-light text-sm rounded-xl">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span className="hidden xs:inline">Projeto</span>
                <span className="xs:hidden">Proj.</span>
              </Button>
            </Link>
            <Link to={createPageUrl("Tasks")}>
              <Button size="sm" className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-light text-sm rounded-xl border-0 shadow-none">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Nova Tarefa
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Progress Bar Strip ──────────────────── */}
        <TaskProgressWidget tasks={tasks} />

        {/* ── Pomodoro Compact Strip ─────────────── */}
        <PomodoroTimer compact />

        {/* ── Executive + KPI Row ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-0">
          {/* Executive Insight — left half */}
          <div className="bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden">
           <div>
             <p className="text-slate-400 mb-2 text-xs font-light uppercase tracking-widest">VISÃO EXECUTIVA</p>
             <p className="text-white text-lg sm:text-xl font-light leading-snug">
               {overdueTasks > 0 ?
               `${overdueTasks} tarefa${overdueTasks > 1 ? 's atrasadas' : ' atrasada'} — atenção necessária` :
               inProgressTasks > 0 ?
               `${inProgressTasks} tarefa${inProgressTasks > 1 ? 's' : ''} em andamento` :
               `Tudo em dia · ${completedTasks} tarefas concluídas`}
             </p>
             <p className="text-slate-400 mt-2 text-sm font-light">
               {activeProjects} projeto{activeProjects !== 1 ? 's' : ''} ativo{activeProjects !== 1 ? 's' : ''} · {totalTasksCount} tarefa{totalTasksCount !== 1 ? 's' : ''} no total
             </p>
           </div>
            <Link to={`${createPageUrl("Tasks")}${overdueTasks > 0 ? '?status=overdue' : ''}`} className="mt-4">
               <button className="flex items-center gap-2 text-sm font-light text-white/70 hover:text-white transition-colors">
                 Ver tarefas <ArrowRight className="w-4 h-4" />
               </button>
             </Link>
          </div>
          {/* KPI Cards — right half */}
          <div>
            <StatsCards
              pendingTasks={pendingTasks}
              inProgressTasks={inProgressTasks}
              completedTasks={completedTasks}
              overdueTasks={overdueTasks} />
          </div>
        </div>

        {/* ── Main Grid ───────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-5 mt-5">

          {/* Left col */}
          <div className="lg:col-span-2 space-y-5">

            {/* Today's tasks */}
             <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-normal text-slate-900">Hoje</h2>
                  <p className="text-xs text-slate-500 font-light mt-0.5">
                    {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <Link to={createPageUrl("Tasks")}>
                  <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors font-light">
                    Ver todas <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <UpcomingTasks tasks={tasks} projects={projects} />
            </div>

            {/* Personal Tasks */}
            <PersonalTasksBlock userEmail={user?.email} />

            {/* Active Projects */}
             <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-normal text-slate-900">Projetos Ativos</h2>
                  <p className="text-xs text-slate-500 font-light mt-0.5">
                    {activeProjects} em andamento
                  </p>
                </div>
                <Link to={createPageUrl("Projects")}>
                  <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors font-light">
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <ProjectProgress projects={projects} tasks={tasks} />
            </div>

            {/* Team Ranking */}
            <UserPerformanceRanking />

            {/* Google Calendar */}
            <GoogleCalendarWidget />

            <NotesBlock userEmail={user?.email} />
          </div>

        </div>
      </div>
    </div>);

}

export default function Dashboard() {
  return (
    <AccessGuard requiredModule="taskflow">
      <DashboardContent />
    </AccessGuard>);

}