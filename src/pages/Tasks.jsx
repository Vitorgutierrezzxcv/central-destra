import React, { useState } from "react";
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
import { parseISO, isWithinInterval } from "date-fns";

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ 
    status: "all", 
    priority: "all", 
    project: "all",
    assignedTo: "all",
    search: "" 
  });
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
      setEditingTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => base44.entities.Task.update(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleSubmit = (taskData) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, taskData });
    } else {
      createTaskMutation.mutate(taskData);
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
    updateTaskMutation.mutate({ 
      id: task.id, 
      taskData: { ...task, status: newStatus } 
    });
  };

  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end });
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filters.status === "all" || task.status === filters.status;
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
    if (dateRange.start && dateRange.end) {
      const taskStartDate = task.start_date ? parseISO(task.start_date) : null;
      const taskEndDate = task.end_date ? parseISO(task.end_date) : null;
      const filterStart = parseISO(dateRange.start);
      const filterEnd = parseISO(dateRange.end);
      
      dateMatch = (
        (taskStartDate && isWithinInterval(taskStartDate, { start: filterStart, end: filterEnd })) ||
        (taskEndDate && isWithinInterval(taskEndDate, { start: filterStart, end: filterEnd })) ||
        (taskStartDate && taskEndDate && 
          taskStartDate <= filterEnd && taskEndDate >= filterStart)
      );
    }
    
    return statusMatch && priorityMatch && projectMatch && assignedToMatch && searchMatch && dateMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Tarefas</h1>
            <p className="text-sm md:text-base text-slate-600">Organize e acompanhe todas as suas tarefas</p>
          </div>
          <Button 
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg rounded-full h-11 md:h-12"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span className="font-medium">Nova Tarefa</span>
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

        <DateRangeFilter onDateRangeChange={handleDateRangeChange} />

        <TaskFilters 
          onFilterChange={setFilters} 
          projects={projects}
          taskCount={filteredTasks.length}
        />

        {loadingTasks || loadingProjects ? (
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 md:h-36 bg-white/50 rounded-xl md:rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="bg-white/80 backdrop-blur-sm shadow-md mb-6 p-1 h-auto grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="grid" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm">
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grade</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm">
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm">
                <TableIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Tabela</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="space-y-3 md:space-y-4">
              <AnimatePresence>
                {filteredTasks.map(task => {
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
                tasks={filteredTasks}
                projects={projects}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                updateTaskMutation={updateTaskMutation}
              />
            </TabsContent>

            <TabsContent value="table">
              <TaskTableView
                tasks={filteredTasks}
                projects={projects}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 md:py-16 bg-white/50 rounded-xl md:rounded-2xl">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 md:w-12 md:h-12 text-slate-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">
              {Object.values(filters).some(f => f !== "all") || dateRange.start || dateRange.end
                ? 'Nenhuma tarefa encontrada'
                : 'Nenhuma tarefa ainda'}
            </h3>
            <p className="text-sm md:text-base text-slate-600 mb-4 md:mb-6 px-4">
              {Object.values(filters).some(f => f !== "all") || dateRange.start || dateRange.end
                ? 'Tente ajustar os filtros'
                : 'Crie sua primeira tarefa para começar'}
            </p>
            {!(Object.values(filters).some(f => f !== "all") || dateRange.start || dateRange.end) && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-full h-11 md:h-12"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeira Tarefa
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}