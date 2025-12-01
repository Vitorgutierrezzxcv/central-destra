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
    initialData: []
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    initialData: []
  });

  const createRecurringTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.RecurringTask.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      setShowForm(false);
      setEditingTask(null);
    }
  });

  const updateRecurringTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => base44.entities.RecurringTask.update(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      setShowForm(false);
      setEditingTask(null);
    }
  });

  const deleteRecurringTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.RecurringTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.RecurringTask.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
    }
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
    }
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

  const filteredTasks = recurringTasks.filter((task) =>
  task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeTasks = filteredTasks.filter((t) => t.active).length;
  const inactiveTasks = filteredTasks.filter((t) => !t.active).length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#6FA6FF] rounded-xl md:rounded-2xl flex items-center justify-center">
              <Repeat className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#131A20] dark:text-white">Tarefas Recorrentes</h1>
              <p className="text-sm md:text-base text-[#456C8D] dark:text-[#8b949e]">
                {activeTasks} ativa{activeTasks !== 1 ? 's' : ''} • {inactiveTasks} pausada{inactiveTasks !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#456C8D] dark:text-[#8b949e] w-4 h-4 md:w-5 md:h-5" />
              <Input
                placeholder="Buscar tarefas recorrentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-800 pl-9 px-3 py-1 text-sm rounded-lg flex w-full border shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:pl-10 border-[#EAEAEA] dark:border-[#30363d] h-10 md:h-11 md:text-base" />


            </div>
            <Button
              onClick={() => {
                setEditingTask(null);
                setShowForm(true);
              }}
              className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg h-10 md:h-11 px-6">

              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="text-sm md:text-base font-medium">Nova Tarefa Recorrente</span>
            </Button>
          </div>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm &&
          <RecurringTaskForm
            task={editingTask}
            projects={projects}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
            isLoading={createRecurringTaskMutation.isPending || updateRecurringTaskMutation.isPending} />

          }
        </AnimatePresence>

        {/* Tasks Grid */}
        {isLoading ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) =>
          <div key={i} className="h-64 bg-[#EAEAEA] rounded-xl animate-pulse" />
          )}
          </div> :
        filteredTasks.length > 0 ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence>
              {filteredTasks.map((task) =>
            <RecurringTaskCard
              key={task.id}
              task={task}
              projects={projects}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onGenerateNow={handleGenerateNow}
              isGenerating={generateTaskMutation.isPending} />

            )}
            </AnimatePresence>
          </div> :

        <div className="flex flex-col items-center justify-center py-16 md:py-24">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-[#EAEAEA] rounded-xl md:rounded-2xl flex items-center justify-center mb-6">
              <Repeat className="w-10 h-10 md:w-16 md:h-16 text-[#456C8D] dark:text-[#8b949e]" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-[#131A20] dark:text-white mb-2">
              {searchTerm ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa recorrente ainda'}
            </h3>
            <p className="text-sm md:text-base text-[#456C8D] dark:text-[#8b949e] mb-6 md:mb-8 text-center max-w-md px-4">
              {searchTerm ?
            'Tente buscar com outros termos ou crie uma nova tarefa recorrente' :
            'Crie tarefas que se repetem automaticamente em intervalos regulares'}
            </p>
            {!searchTerm &&
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg h-11 md:h-12 px-6 md:px-8 text-sm md:text-base font-medium">

                <Plus className="w-5 h-5 mr-2" />
                Criar Primeira Tarefa Recorrente
              </Button>
          }
          </div>
        }
      </div>
    </div>);

}