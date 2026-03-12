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

import TasksCalendar from "../components/dashboard/TasksCalendar";
import NotesBlock from "../components/dashboard/NotesBlock";
import StatsCards from "../components/dashboard/StatsCards";
import ProjectProgress from "../components/dashboard/ProjectProgress";
import UpcomingTasks from "../components/dashboard/UpcomingTasks";
import UserPerformanceRanking from "../components/dashboard/UserPerformanceRanking";
import AccessGuard from "../components/layout/AccessGuard";
import PomodoroTimer from "../components/dashboard/PomodoroTimer";
import TaskProgressWidget from "../components/dashboard/TaskProgressWidget";

function DashboardContent() {
  const [selectedDate, setSelectedDate] = useState(new Date());

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
      <div className="min-h-screen bg-[#F8F9FB] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-56 rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-72 rounded-xl" />
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
    <div className="min-h-screen bg-[#F7F7F7] p-5 md:p-7 lg:p-9">
      <div className="max-w-7xl mx-auto w-full">

        {/* ── Page Header ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <p className="text-xs font-light text-[#456C8D] mb-0.5 uppercase tracking-wider">{greeting()}</p>
            <h1 className="text-[26px] font-light text-[#131A20] tracking-tight leading-tight">
              {displayName}
            </h1>
            <p className="text-sm font-light text-[#456C8D] mt-0.5 capitalize">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("Projects")}>
              <Button variant="outline" size="sm" className="h-9 border-[#EAEAEA] bg-white text-[#131A20] hover:bg-[#F7F7F7] font-light text-sm rounded-xl">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Projeto
              </Button>
            </Link>
            <Link to={createPageUrl("Tasks")}>
              <Button size="sm" className="h-9 bg-[#131A20] hover:bg-[#456C8D] text-white font-light text-sm rounded-xl border-0 shadow-none">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Nova Tarefa
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Progress Bar Strip ──────────────────── */}
        <TaskProgressWidget tasks={tasks} />

        {/* ── Pomodoro Compact Strip ─────────────── */}
        <PomodoroTimer compact />

        {/* ── KPI Strip ───────────────────────────── */}
        <StatsCards
          pendingTasks={pendingTasks}
          inProgressTasks={inProgressTasks}
          completedTasks={completedTasks}
          overdueTasks={overdueTasks} />


        {/* ── Executive Insight Block ─────────────── */}
        <div className="mt-5 bg-[#131A20] rounded-2xl p-6 md:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[#6FA6FF] text-xs font-light uppercase tracking-widest mb-1">Visão Executiva</p>
            <p className="text-white text-lg font-light leading-snug">
              {overdueTasks > 0 ?
              `${overdueTasks} tarefa${overdueTasks > 1 ? 's atrasadas' : ' atrasada'} — atenção necessária` :
              inProgressTasks > 0 ?
              `${inProgressTasks} tarefa${inProgressTasks > 1 ? 's' : ''} em andamento` :
              `Tudo em dia · ${completedTasks} tarefas concluídas`}
            </p>
            <p className="text-[#456C8D] text-sm font-light mt-1">
              {activeProjects} projeto{activeProjects !== 1 ? 's' : ''} ativo{activeProjects !== 1 ? 's' : ''} · {totalTasksCount} tarefa{totalTasksCount !== 1 ? 's' : ''} no total
            </p>
          </div>
          <Link to={createPageUrl("Tasks")}>
            <button className="flex items-center gap-2 text-sm font-light text-white/70 hover:text-white transition-colors whitespace-nowrap">
              Ver tarefas <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* ── Main Grid ───────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-5 mt-5">

          {/* Left col */}
          <div className="lg:col-span-2 space-y-5">

            {/* Today's tasks */}
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-normal text-[#131A20]">Hoje</h2>
                  <p className="text-xs text-[#456C8D] font-light mt-0.5">
                    {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <Link to={createPageUrl("Tasks")}>
                  <button className="text-xs text-[#6FA6FF] hover:text-[#456C8D] flex items-center gap-1 transition-colors font-light">
                    Ver todas <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <UpcomingTasks tasks={tasks} projects={projects} />
            </div>

            {/* Active Projects */}
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-normal text-[#131A20]">Projetos Ativos</h2>
                  <p className="text-xs text-[#456C8D] font-light mt-0.5">
                    {activeProjects} em andamento
                  </p>
                </div>
                <Link to={createPageUrl("Projects")}>
                  <button className="text-xs text-[#6FA6FF] hover:text-[#456C8D] flex items-center gap-1 transition-colors font-light">
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <ProjectProgress projects={projects} tasks={tasks} />
            </div>

            {/* Team Ranking */}
            <UserPerformanceRanking />

            {/* Calendar + Notes below ranking */}
            <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5">
              <h2 className="text-sm font-normal text-[#131A20] mb-4">Calendário</h2>
              <TasksCalendar
                tasks={tasks}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate} />
            </div>

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