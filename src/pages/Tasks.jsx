import React, { useState, useEffect } from "react";
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
import { parseISO, isWithinInterval, isBefore, isSameDay, startOfDay } from "date-fns";

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
    onSuccess: () => {
      // Invalidation handled by handleSubmit for all related tasks
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => base44.entities.Task.update(id, taskData),
    onSuccess: () => {
      // Invalidation handled by handleSubmit for all related tasks
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
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
    updateTaskMutation.mutate({ 
      id: task.id, 
      taskData: { ...task, status: newStatus } 
    });
  };

  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end });
  };

  const filteredTasks = tasks.filter(task => {
    // Exclude subtasks from the main list view. Subtasks will be handled within their parent task's form/display.
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

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#131A20] mb-2">Tarefas</h1>
            <p className="text-sm md:text-base text-[#456C8D]">Organize e acompanhe todas as suas tarefas</p>
          </div>
          <Button 
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="w-full sm:w-auto bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg h-11 md:h-12"
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
          filters={filters}
          projects={projects}
          taskCount={sortedTasks.length}
        />

        {loadingTasks || loadingProjects ? (
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 md:h-36 bg-[#EAEAEA] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="bg-[#EAEAEA] mb-6 p-1 h-auto grid grid-cols-3 w-full sm:w-auto rounded-lg">
              <TabsTrigger value="grid" className="flex items-center gap-2 data-[state=active]:bg-[#6FA6FF] data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm">
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grade</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2 data-[state=active]:bg-[#6FA6FF] data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm">
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2 data-[state=active]:bg-[#6FA6FF] data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm">
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
          <div className="text-center py-12 md:py-16 bg-[#EAEAEA]/30 rounded-xl">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-[#EAEAEA] rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 md:w-12 md:h-12 text-[#456C8D]" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-[#131A20] mb-2">
              {Object.values(filters).some(f => f !== "all") || dateRange.start || dateRange.end
                ? 'Nenhuma tarefa encontrada'
                : 'Nenhuma tarefa ainda'}
            </h3>
            <p className="text-sm md:text-base text-[#456C8D] mb-4 md:mb-6 px-4">
              {Object.values(filters).some(f => f !== "all") || dateRange.start || dateRange.end
                ? 'Tente ajustar os filtros'
                : 'Crie sua primeira tarefa para começar'}
            </p>
            {!(Object.values(filters).some(f => f !== "all") || dateRange.start || dateRange.end) && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg h-11 md:h-12"
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