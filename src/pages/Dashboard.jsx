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

export default function Dashboard() {
  const [viewMode, setViewMode] = useState("week");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['my-tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ assigned_to: user.email }),
    initialData: [],
    enabled: !!user,
  });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    initialData: [],
  });

  if (loadingUser || loadingTasks || loadingProjects) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
          </div>
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
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

  const filteredTasks = tasks.filter(task => {
    const taskDate = task.start_date ? new Date(task.start_date) : task.end_date ? new Date(task.end_date) : null;
    if (!taskDate) return false;
    return taskDate >= start && taskDate <= end;
  });

  const now = new Date();
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  
  const overdueTasks = tasks.filter(t => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-slate-600 text-lg mb-1">{greeting()},</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
              {user?.full_name?.split(' ')[0] || 'Usuário'}!
            </h1>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("Projects")}>
              <Button className="bg-white text-slate-700 hover:bg-slate-50 shadow-lg rounded-full px-6">
                <Plus className="w-5 h-5 mr-2" />
                Novo Projeto
              </Button>
            </Link>
            <Link to={createPageUrl("Tasks")}>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg rounded-full px-6">
                <Plus className="w-5 h-5 mr-2" />
                Nova Tarefa
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          pendingTasks={pendingTasks}
          inProgressTasks={inProgressTasks}
          completedTasks={completedTasks}
          overdueTasks={overdueTasks}
        />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Today's Tasks & Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <Card className="shadow-xl border-none rounded-3xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-yellow-100 to-orange-100 border-none pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900 mb-1">
                      Hoje
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-3 shadow-md">
                    <CalendarIcon className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <UpcomingTasks tasks={tasks} projects={projects} />
              </CardContent>
            </Card>

            {/* Projects Overview */}
            <Card className="shadow-xl border-none rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Projetos</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      Você tem {projects.filter(p => p.status === 'active').length} projeto(s) ativo(s)
                    </p>
                  </div>
                  <Link to={createPageUrl("Projects")}>
                    <Button variant="ghost" size="sm" className="rounded-full">
                      Ver todos
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ProjectProgress projects={projects} tasks={tasks} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Calendar & Notes */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card className="shadow-xl border-none rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-500" />
                  Calendário
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <TasksCalendar
                  tasks={tasks}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                />
              </CardContent>
            </Card>

            {/* Notes Block */}
            <NotesBlock userEmail={user?.email} />
          </div>
        </div>
      </div>
    </div>
  );
}