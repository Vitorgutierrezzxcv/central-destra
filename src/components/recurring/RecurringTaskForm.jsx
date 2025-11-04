import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const weekdayLabels = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado'
};

export default function RecurringTaskForm({ task, projects, onSubmit, onCancel, isLoading }) {
  const [currentTask, setCurrentTask] = useState(task || {
    title: "",
    description: "",
    assigned_to: null,
    project_id: "",
    priority: "medium",
    recurrence_type: "weekly",
    recurrence_interval: 1,
    weekdays: [],
    day_of_month: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    active: true,
    time_estimate: 0
  });

  const [estimateHours, setEstimateHours] = useState(
    task?.time_estimate ? Math.floor(task.time_estimate / 3600) : 0
  );
  const [estimateMinutes, setEstimateMinutes] = useState(
    task?.time_estimate ? Math.floor((task.time_estimate % 3600) / 60) : 0
  );

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: userProfiles } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  const uniqueUsers = React.useMemo(() => {
    const userMap = new Map();
    
    userProfiles.forEach(profile => {
      if (profile.user_email) {
        userMap.set(profile.user_email, {
          id: profile.id,
          user_email: profile.user_email,
          display_name: profile.display_name || profile.full_name || profile.user_email.split('@')[0],
          full_name: profile.full_name || profile.user_email.split('@')[0]
        });
      }
    });
    
    users.forEach(user => {
      if (user.email && !userMap.has(user.email)) {
        userMap.set(user.email, {
          id: user.id,
          user_email: user.email,
          display_name: user.display_name || user.full_name || user.email.split('@')[0],
          full_name: user.full_name || user.email.split('@')[0]
        });
      }
    });
    
    return Array.from(userMap.values());
  }, [users, userProfiles]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentTask.title.trim() && currentTask.assigned_to) {
      const timeEstimateInSeconds = (estimateHours * 3600) + (estimateMinutes * 60);
      
      const taskData = {
        ...currentTask,
        time_estimate: timeEstimateInSeconds
      };

      onSubmit(taskData);
    }
  };

  const handleWeekdayToggle = (day) => {
    const weekdays = currentTask.weekdays || [];
    if (weekdays.includes(day)) {
      setCurrentTask({
        ...currentTask,
        weekdays: weekdays.filter(d => d !== day)
      });
    } else {
      setCurrentTask({
        ...currentTask,
        weekdays: [...weekdays, day].sort()
      });
    }
  };

  const getUserDisplayName = (userProfile) => {
    return userProfile.display_name || userProfile.full_name || userProfile.user_email;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6 md:mb-8"
    >
      <Card className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-200">
        <CardHeader className="border-b border-slate-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl font-bold text-slate-900">
              {task ? 'Editar Tarefa Recorrente' : 'Nova Tarefa Recorrente'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Título *</Label>
              <Input
                id="title"
                placeholder="O que precisa ser feito regularmente?"
                value={currentTask.title}
                onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
                required
                className="h-10 md:h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Adicione detalhes sobre a tarefa..."
                value={currentTask.description}
                onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned_to" className="text-sm font-medium">Responsável *</Label>
                <Select
                  value={currentTask.assigned_to || ""}
                  onValueChange={(value) => setCurrentTask({...currentTask, assigned_to: value})}
                  required
                >
                  <SelectTrigger id="assigned_to" className="h-10 md:h-11">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueUsers.map(userProfile => (
                      <SelectItem key={userProfile.user_email} value={userProfile.user_email}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                              {getUserDisplayName(userProfile).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{getUserDisplayName(userProfile)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project" className="text-sm font-medium">Projeto (Opcional)</Label>
                <Select
                  value={currentTask.project_id}
                  onValueChange={(value) => setCurrentTask({...currentTask, project_id: value})}
                >
                  <SelectTrigger id="project" className="h-10 md:h-11">
                    <SelectValue placeholder="Nenhum projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum projeto</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">Prioridade</Label>
                <Select
                  value={currentTask.priority}
                  onValueChange={(value) => setCurrentTask({...currentTask, priority: value})}
                >
                  <SelectTrigger id="priority" className="h-10 md:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimate_hours" className="text-sm font-medium">Estimativa (h)</Label>
                <Input
                  id="estimate_hours"
                  type="number"
                  min="0"
                  value={estimateHours}
                  onChange={(e) => setEstimateHours(parseInt(e.target.value) || 0)}
                  className="h-10 md:h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimate_minutes" className="text-sm font-medium">Estimativa (m)</Label>
                <Input
                  id="estimate_minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={estimateMinutes}
                  onChange={(e) => setEstimateMinutes(parseInt(e.target.value) || 0)}
                  className="h-10 md:h-11"
                />
              </div>
            </div>

            {/* Recurrence Settings */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 md:p-6 space-y-4 border border-violet-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                Configurações de Recorrência
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurrence_type" className="text-sm font-medium">Tipo de Recorrência *</Label>
                  <Select
                    value={currentTask.recurrence_type}
                    onValueChange={(value) => setCurrentTask({...currentTask, recurrence_type: value})}
                    required
                  >
                    <SelectTrigger id="recurrence_type" className="h-10 md:h-11 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrence_interval" className="text-sm font-medium">
                    A cada {currentTask.recurrence_type === 'daily' ? 'X dias' : currentTask.recurrence_type === 'weekly' ? 'X semanas' : 'X meses'}
                  </Label>
                  <Input
                    id="recurrence_interval"
                    type="number"
                    min="1"
                    value={currentTask.recurrence_interval}
                    onChange={(e) => setCurrentTask({...currentTask, recurrence_interval: parseInt(e.target.value) || 1})}
                    className="h-10 md:h-11 bg-white"
                  />
                </div>
              </div>

              {/* Weekly: Select days of week */}
              {currentTask.recurrence_type === 'weekly' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dias da Semana</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                      <div key={day} className="flex items-center gap-2 bg-white p-2 rounded-lg">
                        <Checkbox
                          id={`day-${day}`}
                          checked={(currentTask.weekdays || []).includes(day)}
                          onCheckedChange={() => handleWeekdayToggle(day)}
                        />
                        <Label htmlFor={`day-${day}`} className="text-sm cursor-pointer">
                          {weekdayLabels[day]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly: Select day of month */}
              {currentTask.recurrence_type === 'monthly' && (
                <div className="space-y-2">
                  <Label htmlFor="day_of_month" className="text-sm font-medium">Dia do Mês</Label>
                  <Input
                    id="day_of_month"
                    type="number"
                    min="1"
                    max="31"
                    value={currentTask.day_of_month}
                    onChange={(e) => setCurrentTask({...currentTask, day_of_month: parseInt(e.target.value) || 1})}
                    className="h-10 md:h-11 bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-medium">Data de Início *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={currentTask.start_date}
                    onChange={(e) => setCurrentTask({...currentTask, start_date: e.target.value})}
                    required
                    className="h-10 md:h-11 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-sm font-medium">Data de Término (Opcional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={currentTask.end_date}
                    onChange={(e) => setCurrentTask({...currentTask, end_date: e.target.value})}
                    min={currentTask.start_date}
                    className="h-10 md:h-11 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full sm:w-auto h-10 md:h-11"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 h-10 md:h-11"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {task ? 'Salvando...' : 'Criando...'}
                  </>
                ) : (
                  <>{task ? 'Salvar Alterações' : 'Criar Tarefa Recorrente'}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}