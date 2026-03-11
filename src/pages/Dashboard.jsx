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

function DashboardContent() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['my-tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ assigned_to: user.email }),
    enabled: !!user,
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  if (loadingUser || loadingTasks || loadingProjects) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-56 rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const pendingTasks   = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks   = tasks.filter(t => {
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

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[#456C8D] text-sm font-light mb-1">{greeting()},</p>
            <h1 className="text-2xl md:text-3xl font-normal text-[#131A20] tracking-tight">
              {displayName}
            </h1>
            <p className="text-[#456C8D] text-sm font-light mt-1">
              {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("Projects")}>
              <Button variant="outline" size="sm" className="h-9 border-[#EAEAEA] text-[#131A20] hover:bg-[#EAEAEA] font-normal text-sm rounded-lg">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Projeto
              </Button>
            </Link>
            <Link to={createPageUrl("Tasks")}>
              <Button size="sm" className="h-9 bg-[#6FA6FF] hover:bg-[#456C8D] text-white font-normal text-sm rounded-lg border-0">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Tarefa
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <StatsCards
          pendingTasks={pendingTasks}
          inProgressTasks={inProgressTasks}
          completedTasks={completedTasks}
          overdueTasks={overdueTasks}
        />

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-5 mt-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-5">

            {/* Today */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#6FA6FF]/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-[#6FA6FF]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-[#131A20]">Hoje</h2>
                    <p className="text-xs text-[#456C8D] font-light">
                      {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Link to={createPageUrl("Tasks")}>
                  <button className="text-xs text-[#6FA6FF] hover:text-[#456C8D] flex items-center gap-1 transition-colors font-light">
                    Ver todas
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <UpcomingTasks tasks={tasks} projects={projects} />
            </div>

            {/* Projects */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-medium text-[#131A20]">Projetos Ativos</h2>
                  <p className="text-xs text-[#456C8D] font-light mt-0.5">
                    {projects.filter(p => p.status === 'active').length} em andamento
                  </p>
                </div>
                <Link to={createPageUrl("Projects")}>
                  <button className="text-xs text-[#6FA6FF] hover:text-[#456C8D] flex items-center gap-1 transition-colors font-light">
                    Ver todos
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <ProjectProgress projects={projects} tasks={tasks} />
            </div>

            {/* Ranking */}
            <UserPerformanceRanking />
          </div>

          {/* Right */}
          <div className="space-y-5">
            {/* Calendar */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5">
              <h2 className="text-sm font-medium text-[#131A20] mb-4">Calendário</h2>
              <TasksCalendar
                tasks={tasks}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>

            {/* Notes */}
            <NotesBlock userEmail={user?.email} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AccessGuard requiredModule="taskflow">
      <DashboardContent />
    </AccessGuard>
  );
}