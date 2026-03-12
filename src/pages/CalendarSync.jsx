import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, RotateCw, AlertCircle, CheckCircle2, Clock, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CalendarSync() {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: async () => await base44.auth.me()
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user_profile", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["all_tasks_for_calendar"],
    queryFn: async () => await base44.entities.Task.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["all_projects"],
    queryFn: async () => await base44.entities.Project.list()
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/functions/syncTaskToCalendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSyncStatus({ type: "success", message: `${data.synced} tarefas sincronizadas com sucesso` });
      setTimeout(() => setSyncStatus(null), 5000);
      queryClient.invalidateQueries({ queryKey: ["all_tasks_for_calendar"] });
    },
    onError: (error) => {
      setSyncStatus({ type: "error", message: "Erro ao sincronizar com Google Calendar" });
    }
  });

  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      window.location.href = `/api/functions/googleCalendarAuth?redirect=${window.location.pathname}`;
    }
  });

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInView = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const tasksByAssignee = allTasks.reduce((acc, task) => {
    if (!task.assigned_to) return acc;
    if (!acc[task.assigned_to]) acc[task.assigned_to] = [];
    acc[task.assigned_to].push(task);
    return acc;
  }, {});

  const userTasks = userProfile ? tasksByAssignee[user?.email] || [] : [];

  const getTasksForDate = (date) => {
    return userTasks.filter(task => {
      const start = task.start_date ? parseISO(task.start_date) : null;
      const end = task.end_date ? parseISO(task.end_date) : null;
      if (start && isSameDay(start, date)) return true;
      if (end && isSameDay(end, date)) return true;
      return false;
    });
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const getProjectName = (projectId) => {
    return projects.find(p => p.id === projectId)?.name || "Projeto sem nome";
  };

  const statusConfig = {
    pending: { label: "Pendente", color: "bg-amber-50 text-amber-700", icon: Clock },
    in_progress: { label: "Em Andamento", color: "bg-blue-50 text-blue-700", icon: Clock },
    completed: { label: "Concluído", color: "bg-green-50 text-green-700", icon: CheckCircle2 }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-slate-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Calendário Sincronizado
            </h1>
            <p className="text-slate-500 mt-1 font-light">Sincronize suas tarefas com o Google Calendar</p>
          </div>
          <div className="flex gap-3">
            {!userProfile?.google_calendar_connected ? (
              <Button onClick={() => connectGoogleMutation.mutate()} className="gap-2 bg-blue-600 hover:bg-blue-700 font-light">
                <Link2 className="w-4 h-4" />
                Conectar Google Calendar
              </Button>
            ) : (
              <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-2 bg-green-600 hover:bg-green-700 font-light">
                <RotateCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                Sincronizar Agora
              </Button>
            )}
          </div>
        </div>

        {syncStatus && (
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${
            syncStatus.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {syncStatus.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {syncStatus.message}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${userProfile?.google_calendar_connected ? "bg-green-500" : "bg-slate-300"}`} />
            <div>
              <p className="font-light text-slate-900">Google Calendar</p>
              <p className="text-sm text-slate-500 font-light">
                {userProfile?.google_calendar_connected ? "Conectado e sincronizando" : "Desconectado"}
              </p>
            </div>
          </div>
          {userProfile?.google_calendar_connected && (
            <Badge className="bg-green-100 text-green-700 border-0 font-light">Ativo</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  {format(viewDate, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                  >
                    →
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: daysInView[0]?.getDay() || 0 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {daysInView.map(date => {
                  const dayTasks = getTasksForDate(date);
                  const isSelected = selectedDate && isSameDay(selectedDate, date);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`aspect-square p-2 rounded-lg border-2 text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? "bg-blue-50 border-blue-500"
                          : isToday
                          ? "bg-slate-100 border-slate-300"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? "text-blue-700" : "text-slate-900"}`}>
                        {date.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-xs text-blue-600 font-medium">
                          {dayTasks.length} tarefa{dayTasks.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 h-fit sticky top-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {selectedDate 
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : "Selecione uma data"
              }
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDateTasks.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhuma tarefa neste dia</p>
              ) : (
                selectedDateTasks.map(task => {
                  const config = statusConfig[task.status];
                  const Icon = config.icon;
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`w-4 h-4 mt-0.5 ${config.color.split(" ")[1]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                          <p className="text-xs text-slate-500">{getProjectName(task.project_id)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={`${config.color} border-0 text-xs`}>
                          {config.label}
                        </Badge>
                        {task.priority && (
                          <Badge className={`text-xs border-0 ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-700"
                              : task.priority === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                          </Badge>
                        )}
                      </div>
                      {task.gcal_event_id && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Sincronizada
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-2">Total de Tarefas</p>
            <p className="text-2xl font-bold text-slate-900">{userTasks.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-2">Sincronizadas</p>
            <p className="text-2xl font-bold text-green-600">
              {userTasks.filter(t => t.gcal_event_id).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600 mb-2">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">
              {userTasks.filter(t => !t.gcal_event_id && (t.start_date || t.end_date)).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}