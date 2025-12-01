import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Plus, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, isSameDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import TasksCalendar from "../components/dashboard/TasksCalendar";
import TasksList from "../components/dashboard/TasksList";
import NotesBlock from "../components/dashboard/NotesBlock";
import StatsCards from "../components/dashboard/StatsCards";
import ProjectProgress from "../components/dashboard/ProjectProgress";
import UpcomingTasks from "../components/dashboard/UpcomingTasks";
import UserPerformanceRanking from "../components/dashboard/UserPerformanceRanking";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState("week");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['my-tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ assigned_to: user.email }),
    initialData: [],
    enabled: !!user
  });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    initialData: []
  });

  if (loadingUser || loadingTasks || loadingProjects) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-48 md:w-64 mb-6 md:mb-8 rounded-lg" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 md:h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 md:h-96 rounded-xl" />
        </div>
      </div>);

  }

  const getDateRange = () => {
    const today = new Date();
    switch (viewMode) {
      case "day":
        return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
      case "week":
        return { start: startOfWeek(selectedDate, { locale: ptBR }), end: endOfWeek(selectedDate, { locale: ptBR }) };
      case "month":
        return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
      default:
        return { start: startOfWeek(today, { locale: ptBR }), end: endOfWeek(today, { locale: ptBR }) };
    }
  };

  const { start, end } = getDateRange();

  const filteredTasks = tasks.filter((task) => {
    const taskDate = task.start_date ? new Date(task.start_date) : task.end_date ? new Date(task.end_date) : null;
    if (!taskDate) return false;
    return taskDate >= start && taskDate <= end;
  });

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
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const displayName = user?.display_name || user?.full_name?.split(' ')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] p-3 md:p-6 lg:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <p className="text-[#456C8D] dark:text-[#8b949e] text-base md:text-lg mb-1">{greeting()},</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#131A20] dark:text-white mb-4 md:mb-4">
            {displayName}!
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Link to={createPageUrl("Projects")} className="flex-1 sm:flex-initial">
              <Button className="bg-slate-700 text-[#131A20] px-4 py-2 text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 w-full sm:w-auto dark:text-white hover:bg-white/80 shadow-md md:px-6 h-10 md:h-11 border border-[#EAEAEA] dark:border-[#30363d]">
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                <span className="text-sm md:text-base font-medium">Novo Projeto</span>
              </Button>
            </Link>
            <Link to={createPageUrl("Tasks")} className="flex-1 sm:flex-initial">
              <Button className="w-full sm:w-auto bg-[#6FA6FF] hover:bg-[#456C8D] text-white shadow-md rounded-lg px-4 md:px-6 h-10 md:h-11">
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                <span className="text-sm md:text-base font-medium">Nova Tarefa</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          pendingTasks={pendingTasks}
          inProgressTasks={inProgressTasks}
          completedTasks={completedTasks}
          overdueTasks={overdueTasks} />


        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Left Column - Today's Tasks & Projects */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Today's Schedule */}
            <Card className="shadow-md border border-[#EAEAEA] dark:border-[#30363d] dark:border-[#30363d] rounded-xl md:rounded-2xl bg-white dark:bg-[#161b22] overflow-hidden">
              <CardHeader className="bg-[#6FA6FF]/10 border-none p-4 md:pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl md:text-2xl font-semibold text-[#131A20] dark:text-white mb-1">
                      Hoje
                    </CardTitle>
                    <p className="text-xs md:text-sm text-[#456C8D] dark:text-[#8b949e]">
                      {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-2 md:p-3 shadow-sm">
                    <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-[#6FA6FF]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:pt-6">
                <UpcomingTasks tasks={tasks} projects={projects} />
              </CardContent>
            </Card>

            {/* Projects Overview */}
            <Card className="shadow-md border border-[#EAEAEA] dark:border-[#30363d] dark:border-[#30363d] rounded-xl md:rounded-2xl bg-white dark:bg-[#161b22]">
              <CardHeader className="border-b border-[#EAEAEA] dark:border-[#30363d] p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl md:text-2xl font-semibold text-[#131A20] dark:text-white">Projetos</CardTitle>
                    <p className="text-xs md:text-sm text-[#456C8D] dark:text-[#8b949e] mt-1">
                      {projects.filter((p) => p.status === 'active').length} ativo(s)
                    </p>
                  </div>
                  <Link to={createPageUrl("Projects")}>
                    <Button variant="ghost" size="sm" className="rounded-lg text-xs md:text-sm h-8 md:h-9 text-[#6FA6FF] hover:bg-[#6FA6FF]/10">
                      Ver todos
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:pt-6">
                <ProjectProgress projects={projects} tasks={tasks} />
              </CardContent>
            </Card>

            {/* User Performance Ranking */}
            <UserPerformanceRanking />
          </div>

          {/* Right Column - Calendar & Notes */}
          <div className="space-y-4 md:space-y-6">
            {/* Calendar */}
            <Card className="shadow-md border border-[#EAEAEA] dark:border-[#30363d] dark:border-[#30363d] rounded-xl md:rounded-2xl bg-white dark:bg-[#161b22]">
              <CardHeader className="border-b border-[#EAEAEA] dark:border-[#30363d] p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl font-semibold text-[#131A20] dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-[#6FA6FF]" />
                  Calendário
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:pt-6">
                <TasksCalendar
                  tasks={tasks}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate} />

              </CardContent>
            </Card>

            {/* Notes Block */}
            <NotesBlock userEmail={user?.email} />
          </div>
        </div>
      </div>
    </div>);

}