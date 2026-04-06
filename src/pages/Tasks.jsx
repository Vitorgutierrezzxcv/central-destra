import React, { useState, useEffect } from "react";
import PullToRefresh from "../components/mobile/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, Kanban, Table as TableIcon } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskForm from "../components/tasks/TaskForm";
import TaskFilters from "../components/tasks/TaskFilters";
import TaskItem from "../components/tasks/TaskItem";
import TaskKanbanView from "../components/tasks/TaskKanbanView";
import TaskTableView from "../components/tasks/TaskTableView";
import DateRangeFilter from "../components/tasks/DateRangeFilter";
import { parseISO, isWithinInterval, isBefore, isSameDay, startOfDay, addDays } from "date-fns";

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ 
    status: "all", 
    priority: "all", 
    project: "all",
    assignedTo: "all",
    search: "",
    dateRange: "all",
    dateFrom: undefined,
    dateTo: undefined
  });
  
  const queryClient = useQueryClient();

  // Read URL parameters and apply filters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    const assignedToParam = urlParams.get('assignedTo');
    
    if (statusParam || assignedToParam) {
      setFilters(prev => ({
        ...prev,
        status: statusParam || prev.status,
        assignedTo: assignedToParam || prev.assignedTo
      }));
    }
  }, []);

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date'),
    initialData: [],
  });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    initialData: [],
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onMutate: async (taskData) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const prev = queryClient.getQueryData(['tasks']);
      const tempTask = { id: `temp-${Date.now()}`, ...taskData, created_date: new Date().toISOString() };
      queryClient.setQueryData(['tasks'], old => [tempTask, ...(old || [])]);
      return { prev };
    },
    onError: (_err, _data, ctx) => queryClient.setQueryData(['tasks'], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => base44.entities.Task.update(id, taskData),
    onMutate: async ({ id, taskData }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const prev = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], old =>
        (old || []).map(t => t.id === id ? { ...t, ...taskData } : t)
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => queryClient.setQueryData(['tasks'], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const prev = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], old => (old || []).filter(t => t.id !== id));
      return { prev };
    },
    onError: (_err, _data, ctx) => queryClient.setQueryData(['tasks'], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleSubmit = async (taskData, subtasks = []) => {
    try {
      let savedTask;
      if (editingTask) {
        await updateTaskMutation.mutateAsync({ id: editingTask.id, taskData });
        savedTask = { ...editingTask, ...taskData };
        
        // Fetch existing subtasks
        const existingSubtasks = await base44.entities.Task.filter({ parent_task_id: editingTask.id });
        const existingIds = new Set(existingSubtasks.map(st => st.id));
        
        // Delete removed subtasks
        const currentIds = new Set(subtasks.filter(st => st.id && !st.id.startsWith('temp-')).map(st => st.id));
        const toDelete = existingSubtasks.filter(st => !currentIds.has(st.id));
        await Promise.all(toDelete.map(st => base44.entities.Task.delete(st.id)));
        
        // Update or create subtasks
        const operations = subtasks.map(subtask => {
          const subtaskData = {
            title: subtask.title,
            status: subtask.status || 'pending',
            priority: subtask.priority,
            assigned_to: subtask.assigned_to,
            start_date: subtask.start_date,
            end_date: subtask.end_date,
            project_id: taskData.project_id, // Inherit project from parent
            parent_task_id: editingTask.id
          };
          
          if (subtask.id && !subtask.id.startsWith('temp-') && existingIds.has(subtask.id)) {
            return base44.entities.Task.update(subtask.id, subtaskData);
          } else {
            return base44.entities.Task.create(subtaskData);
          }
        });
        
        await Promise.all(operations);
      } else {
        savedTask = await createTaskMutation.mutateAsync(taskData);
        
        // Create subtasks
        if (subtasks.length > 0) {
          await base44.entities.Task.bulkCreate(
            subtasks.map(subtask => ({
              title: subtask.title,
              status: subtask.status || 'pending',
              priority: subtask.priority,
              assigned_to: subtask.assigned_to,
              start_date: subtask.start_date,
              end_date: subtask.end_date,
              project_id: taskData.project_id,
              parent_task_id: savedTask.id
            }))
          );
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
      // Depending on UI requirements, you might want to show a toast or message here
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleStatusChange = (task, newStatus) => {
    const now = new Date();
    const extraFields = {};
    if (newStatus === "completed" && task.status !== "completed") {
      extraFields.completed_at = now.toISOString();
      // Prazo de 3 dias para aprovação do cliente
      const deadline = new Date(now);
      deadline.setDate(deadline.getDate() + 3);
      extraFields.approval_deadline = deadline.toISOString();
    } else if (newStatus !== "completed") {
      // Se sair de concluído, limpa os campos de aprovação
      extraFields.completed_at = null;
      extraFields.approval_deadline = null;
      extraFields.approval_status = null;
    }
    updateTaskMutation.mutate({
      id: task.id,
      taskData: { ...task, status: newStatus, ...extraFields }
    });
  };

  const filteredTasks = tasks.filter(task => {
    // Exclude subtasks from the main list view
    if (task.parent_task_id) {
      return false;
    }

    // Handle overdue status filter
    const now = new Date();
    const isOverdue = task.status !== 'completed' && 
                      task.end_date && 
                      isBefore(new Date(task.end_date), now) && 
                      !isSameDay(new Date(task.end_date), now);
    
    let statusMatch;
    if (filters.status === "overdue") {
      statusMatch = isOverdue;
    } else {
      statusMatch = filters.status === "all" || task.status === filters.status;
    }

    const priorityMatch = filters.priority === "all" || task.priority === filters.priority;
    const projectMatch = filters.project === "all" || task.project_id === filters.project;
    const assignedToMatch = filters.assignedTo === "all" || 
      (filters.assignedTo === "unassigned" && !task.assigned_to) ||
      task.assigned_to === filters.assignedTo;
    const searchMatch = !filters.search || 
      task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    // Date range filter
    let dateMatch = true;
    if (filters.dateFrom || filters.dateTo) {
      const taskEndDate = task.end_date ? parseISO(task.end_date) : null;
      if (taskEndDate) {
        if (filters.dateFrom && filters.dateTo) {
          dateMatch = isWithinInterval(taskEndDate, { start: filters.dateFrom, end: filters.dateTo });
        } else if (filters.dateFrom) {
          dateMatch = !isBefore(taskEndDate, filters.dateFrom);
        } else if (filters.dateTo) {
          dateMatch = !isWithinInterval(taskEndDate, { start: addDays(filters.dateTo, 1), end: new Date('2999-12-31') });
        }
      }
    }
    
    return statusMatch && priorityMatch && projectMatch && assignedToMatch && searchMatch && dateMatch;
  });

  // Sort tasks: completed at the end, then by urgency (overdue first, then by end_date)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks always go to the end
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.status === 'completed' && b.status === 'completed') {
      // Among completed, sort by completion date (most recent first)
      return new Date(b.updated_date || 0) - new Date(a.updated_date || 0);
    }

    // For non-completed tasks, sort by end_date (most urgent first)
    const now = startOfDay(new Date());
    const aDate = a.end_date ? startOfDay(parseISO(a.end_date)) : null;
    const bDate = b.end_date ? startOfDay(parseISO(b.end_date)) : null;

    // Tasks without end_date go after tasks with end_date
    if (!aDate && bDate) return 1;
    if (aDate && !bDate) return -1;
    if (!aDate && !bDate) return 0;

    // Sort by date ascending (earliest/overdue first)
    return aDate - bDate;
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-white p-5 md:p-7 lg:p-9">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-[26px] font-light text-slate-900 tracking-tight">Tarefas</h1>
            <p className="text-sm font-light text-slate-500 mt-0.5">Organize e acompanhe todas as suas tarefas</p>
          </div>
          <Button
            onClick={() => { setEditingTask(null); setShowForm(true); }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 font-light shadow-none border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <TaskForm
              task={editingTask}
              projects={projects}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingTask(null);
              }}
              isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
            />
          )}
        </AnimatePresence>

        <TaskFilters 
          onFilterChange={setFilters} 
          filters={filters}
          projects={projects}
          taskCount={sortedTasks.length}
        />

        {loadingTasks || loadingProjects ? (
           <div className="space-y-3 md:space-y-4">
             {[1, 2, 3, 4, 5].map(i => (
               <div key={i} className="h-32 md:h-36 bg-slate-200 rounded-xl animate-pulse" />
             ))}
           </div>
        ) : filteredTasks.length > 0 ? (
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="bg-slate-100 mb-6 p-1 h-auto grid grid-cols-3 w-full sm:w-auto rounded-xl">
              <TabsTrigger value="grid" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm font-light">
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grade</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm font-light">
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm font-light">
                <TableIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Tabela</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="space-y-3 md:space-y-4">
              <AnimatePresence>
                {sortedTasks.map(task => {
                  const project = projects.find(p => p.id === task.project_id);
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      project={project}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  );
                })}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="kanban">
              <TaskKanbanView
                tasks={sortedTasks}
                projects={projects}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                updateTaskMutation={updateTaskMutation}
              />
            </TabsContent>

            <TabsContent value="table">
              <TaskTableView
                tasks={sortedTasks}
                projects={projects}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 md:w-12 md:h-12 text-slate-500" />
            </div>
            <h3 className="text-lg md:text-xl font-light text-slate-900 mb-2">
              {Object.values(filters).some(f => f !== "all") || dateRange.start || dateRange.end
                ? 'Nenhuma tarefa encontrada'
                : 'Nenhuma tarefa ainda'}
            </h3>
            <p className="text-sm md:text-base text-slate-500 mb-4 md:mb-6 px-4 font-light">
              {Object.values(filters).some(f => f !== "all") || dateRange.start || dateRange.end
                ? 'Tente ajustar os filtros'
                : 'Crie sua primeira tarefa para começar'}
            </p>
            {!(Object.values(filters).some(f => f !== "all") || dateRange.start || dateRange.end) && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-11 md:h-12 font-light"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeira Tarefa
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}