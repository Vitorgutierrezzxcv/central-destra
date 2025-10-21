import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, AlertCircle, Clock, CheckCircle2, ListTodo } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, isAfter, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

import TasksCalendar from "../components/dashboard/TasksCalendar";
import TasksList from "../components/dashboard/TasksList";
import NotesBlock from "../components/dashboard/NotesBlock";
import StatsCards from "../components/dashboard/StatsCards";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Filtrar tarefas por período
  const getDateRange = () => {
    const today = new Date();
    switch (viewMode) {
      case "day":
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate)
        };
      case "week":
        return {
          start: startOfWeek(selectedDate, { locale: ptBR }),
          end: endOfWeek(selectedDate, { locale: ptBR })
        };
      case "month":
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate)
        };
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

  // Calcular estatísticas
  const now = new Date();
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.end_date) return false;
    return isBefore(new Date(t.end_date), now) && !isSameDay(new Date(t.end_date), now);
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Olá, {user?.full_name?.split(' ')[0] || 'Usuário'}! 👋
          </h1>
          <p className="text-slate-600">
            Aqui está um resumo das suas atividades
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <StatsCards
          pendingTasks={pendingTasks}
          inProgressTasks={inProgressTasks}
          completedTasks={completedTasks}
          overdueTasks={overdueTasks}
        />

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Calendário e Tarefas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendário do Mês */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Calendário do Mês
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

            {/* Lista de Tarefas */}
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ListTodo className="w-5 h-5" />
                    Minhas Tarefas
                  </CardTitle>
                  <Tabs value={viewMode} onValueChange={setViewMode} className="w-full md:w-auto">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="day">Dia</TabsTrigger>
                      <TabsTrigger value="week">Semana</TabsTrigger>
                      <TabsTrigger value="month">Mês</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <TasksList
                  tasks={filteredTasks}
                  projects={projects}
                  viewMode={viewMode}
                  selectedDate={selectedDate}
                />
              </CardContent>
            </Card>
          </div>

          {/* Bloco de Anotações */}
          <div className="lg:col-span-1">
            <NotesBlock userEmail={user?.email} />
          </div>
        </div>
      </div>
    </div>
  );
}