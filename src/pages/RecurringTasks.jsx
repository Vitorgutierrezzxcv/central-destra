import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Repeat, Play, Pause } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence } from "framer-motion";
import { addDays, addWeeks, addMonths, format, parseISO } from "date-fns";

import RecurringTaskForm from "../components/recurring/RecurringTaskForm";
import RecurringTaskCard from "../components/recurring/RecurringTaskCard";

export default function RecurringTasks() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: recurringTasks, isLoading } = useQuery({
    queryKey: ['recurring-tasks'],
    queryFn: () => base44.entities.RecurringTask.list('-created_date'),
    initialData: [],
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    initialData: [],
  });

  const createRecurringTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.RecurringTask.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      setShowForm(false);
      setEditingTask(null);
    },
  });

  const updateRecurringTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => base44.entities.RecurringTask.update(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      setShowForm(false);
      setEditingTask(null);
    },
  });

  const deleteRecurringTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.RecurringTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.RecurringTask.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
    },
  });

  const generateTaskMutation = useMutation({
    mutationFn: async (recurringTask) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Calcular próxima data de geração
      let nextDate = new Date();
      if (recurringTask.recurrence_type === 'daily') {
        nextDate = addDays(nextDate, recurringTask.recurrence_interval || 1);
      } else if (recurringTask.recurrence_type === 'weekly') {
        nextDate = addWeeks(nextDate, recurringTask.recurrence_interval || 1);
      } else if (recurringTask.recurrence_type === 'monthly') {
        nextDate = addMonths(nextDate, recurringTask.recurrence_interval || 1);
      }

      // Criar a tarefa
      const taskData = {
        title: recurringTask.title,
        description: recurringTask.description,
        assigned_to: recurringTask.assigned_to,
        project_id: recurringTask.project_id,
        priority: recurringTask.priority,
        status: 'pending',
        start_date: today,
        time_estimate: recurringTask.time_estimate || 0
      };

      await base44.entities.Task.create(taskData);

      // Atualizar a tarefa recorrente
      await base44.entities.RecurringTask.update(recurringTask.id, {
        last_generated_date: today,
        next_generation_date: format(nextDate, 'yyyy-MM-dd')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleSubmit = (taskData) => {
    // Calcular next_generation_date baseado na start_date e recurrence
    let nextDate = parseISO(taskData.start_date);
    if (taskData.recurrence_type === 'daily') {
      nextDate = addDays(nextDate, taskData.recurrence_interval || 1);
    } else if (taskData.recurrence_type === 'weekly') {
      nextDate = addWeeks(nextDate, taskData.recurrence_interval || 1);
    } else if (taskData.recurrence_type === 'monthly') {
      nextDate = addMonths(nextDate, taskData.recurrence_interval || 1);
    }

    const dataWithNext = {
      ...taskData,
      next_generation_date: format(nextDate, 'yyyy-MM-dd')
    };

    if (editingTask) {
      updateRecurringTaskMutation.mutate({ id: editingTask.id, taskData: dataWithNext });
    } else {
      createRecurringTaskMutation.mutate(dataWithNext);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa recorrente?')) {
      deleteRecurringTaskMutation.mutate(taskId);
    }
  };

  const handleToggleActive = (task) => {
    toggleActiveMutation.mutate({ id: task.id, active: !task.active });
  };

  const handleGenerateNow = (task) => {
    if (window.confirm('Deseja gerar uma instância desta tarefa agora?')) {
      generateTaskMutation.mutate(task);
    }
  };

  const filteredTasks = recurringTasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeTasks = filteredTasks.filter(t => t.active).length;
  const inactiveTasks = filteredTasks.filter(t => !t.active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg">
              <Repeat className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Tarefas Recorrentes</h1>
              <p className="text-sm md:text-base text-slate-600">
                {activeTasks} ativa{activeTasks !== 1 ? 's' : ''} • {inactiveTasks} pausada{inactiveTasks !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
              <Input
                placeholder="Buscar tarefas recorrentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm h-10 md:h-11 text-sm md:text-base rounded-full"
              />
            </div>
            <Button 
              onClick={() => {
                setEditingTask(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg rounded-full h-10 md:h-11 px-6"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="text-sm md:text-base font-medium">Nova Tarefa Recorrente</span>
            </Button>
          </div>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <RecurringTaskForm
              task={editingTask}
              projects={projects}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingTask(null);
              }}
              isLoading={createRecurringTaskMutation.isPending || updateRecurringTaskMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* Tasks Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white/50 rounded-2xl md:rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence>
              {filteredTasks.map(task => (
                <RecurringTaskCard
                  key={task.id}
                  task={task}
                  projects={projects}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onGenerateNow={handleGenerateNow}
                  isGenerating={generateTaskMutation.isPending}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 md:py-24">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl md:rounded-[2rem] flex items-center justify-center mb-6 shadow-lg">
              <Repeat className="w-10 h-10 md:w-16 md:h-16 text-violet-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
              {searchTerm ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa recorrente ainda'}
            </h3>
            <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-8 text-center max-w-md px-4">
              {searchTerm 
                ? 'Tente buscar com outros termos ou crie uma nova tarefa recorrente' 
                : 'Crie tarefas que se repetem automaticamente em intervalos regulares'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg rounded-full h-11 md:h-12 px-6 md:px-8 text-sm md:text-base font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeira Tarefa Recorrente
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}