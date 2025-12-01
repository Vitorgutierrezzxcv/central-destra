import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  List,
  Pencil,
  Trash2,
  ListTodo,
  Package, // Added Package icon
  Table as TableIcon // Added Table icon for the new view
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence } from "framer-motion";

import GanttChart from "../components/project-detail/GanttChart";
import TaskListView from "../components/project-detail/TaskListView";
import TaskTableView from "../components/project-detail/TaskTableView"; // New import for Table View
import TaskFormDialog from "../components/tasks/TaskFormDialog"; // Changed from TaskForm to TaskFormDialog
import ProjectForm from "../components/projects/ProjectForm";
import AddModuleDialog from "../components/project-detail/AddModuleDialog";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showModuleDialog, setShowModuleDialog] = useState(false); // New state for AddModuleDialog
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.list();
      return projects.find(p => p.id === projectId);
    },
    enabled: !!projectId,
  });

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }, '-start_date'), // Changed sorting from -scheduled_date to -start_date
    initialData: [],
    enabled: !!projectId,
  });

  const { data: allProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    initialData: [],
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    // onSuccess is handled manually in handleTaskSubmit now, so remove from here.
    // The query invalidation will be done after subtasks are also handled.
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => base44.entities.Task.update(id, taskData),
    // onSuccess is handled manually in handleTaskSubmit now.
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, projectData }) => base44.entities.Project.update(id, projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowProjectForm(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id) => {
      await Promise.all(tasks.map(task => base44.entities.Task.delete(task.id)));
      await base44.entities.Project.delete(id);
    },
    onSuccess: () => {
      navigate(createPageUrl("Projects"));
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleTaskSubmit = async (taskData, subtasks = []) => {
    const dataWithProject = { ...taskData, project_id: projectId };
    
    try {
      let savedTask;
      if (editingTask) {
        await updateTaskMutation.mutateAsync({ id: editingTask.id, taskData: dataWithProject });
        // It's important to use the potentially updated task data for further operations
        savedTask = { ...editingTask, ...dataWithProject };
        
        // Atualizar/Criar subtarefas
        // Fetch existing subtasks for comparison
        const existingSubtasksFromDB = await base44.entities.Task.filter({ parent_task_id: editingTask.id });
        const existingSubtaskIdsInDB = new Set(existingSubtasksFromDB.map(st => st.id));
        
        const subtaskOperations = []; // To hold promises for parallel execution

        const subtaskIdsInForm = new Set(); // Track subtask IDs that are in the current form
        
        for (const subtask of subtasks) {
          const subtaskPayload = {
            title: subtask.title,
            status: subtask.completed ? 'completed' : 'pending',
            project_id: taskData.project_id, // Inherit from parent
            parent_task_id: editingTask.id,
            priority: dataWithProject.priority, // Inherit from parent
            assigned_to: dataWithProject.assigned_to // Inherit from parent
          };
          
          if (subtask.id && !subtask.id.startsWith('temp-') && existingSubtaskIdsInDB.has(subtask.id)) {
            // This is an existing subtask from the DB that is also in the form, so update it.
            subtaskOperations.push(base44.entities.Task.update(subtask.id, subtaskPayload));
            subtaskIdsInForm.add(subtask.id);
          } else if (subtask.id && subtask.id.startsWith('temp-')) {
            // This is a new subtask added in the form, so create it.
            subtaskOperations.push(base44.entities.Task.create(subtaskPayload));
          } else if (!subtask.id) { // New subtask without temp-id, implying it's new
            subtaskOperations.push(base44.entities.Task.create(subtaskPayload));
          }
        }

        // Identify subtasks to delete: those existing in the DB but not present in the current form's subtasks array
        for (const existingSubtask of existingSubtasksFromDB) {
          if (!subtaskIdsInForm.has(existingSubtask.id)) {
            subtaskOperations.push(base44.entities.Task.delete(existingSubtask.id));
          }
        }
        
        // Execute all subtask creation and update operations in parallel
        await Promise.all(subtaskOperations);

      } else {
        savedTask = await createTaskMutation.mutateAsync(dataWithProject);
        
        // Criar subtarefas
        if (subtasks.length > 0) {
          await base44.entities.Task.bulkCreate(
            subtasks.map(subtask => ({
              title: subtask.title,
              status: subtask.completed ? 'completed' : 'pending',
              project_id: taskData.project_id,
              parent_task_id: savedTask.id,
              priority: dataWithProject.priority,
              assigned_to: dataWithProject.assigned_to
            }))
          );
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
      // Depending on UI requirements, you might want to show a toast or message here
    }
  };

  const handleProjectSubmit = (projectData) => {
    updateProjectMutation.mutate({ id: projectId, projectData });
  };

  const handleTaskEdit = async (task) => {
    // Fetch subtasks for the task being edited
    const subtasks = await base44.entities.Task.filter({ parent_task_id: task.id });
    setEditingTask({ ...task, subtasks });
    setShowTaskForm(true);
  };

  const handleTaskDelete = (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa? Todas as subtarefas também serão excluídas.')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleTaskStatusChange = (task, newStatus) => {
    updateTaskMutation.mutate({
      id: task.id,
      taskData: { ...task, status: newStatus }
    });
  };

  const handleProjectDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este projeto? Todas as tarefas serão removidas.')) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  // New function for module success
  const handleModuleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setShowModuleDialog(false); // Close dialog on success
  };

  if (!projectId) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-[#456C8D] dark:text-[#8b949e] mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-semibold text-[#131A20] dark:text-white mb-2">Projeto não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl("Projects"))} className="mt-4 bg-[#6FA6FF] hover:bg-[#456C8D] text-white">
            Voltar para Projetos
          </Button>
        </div>
      </div>
    );
  }

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <Skeleton className="h-12 md:h-16 w-full rounded-xl" />
          <Skeleton className="h-24 md:h-32 w-full rounded-xl" />
          <Skeleton className="h-64 md:h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#456C8D] dark:text-[#8b949e] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-[#131A20] dark:text-white mb-2">Projeto não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl("Projects"))} className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white">
            Voltar para Projetos
          </Button>
        </div>
      </div>
    );
  }

  // Filter out subtasks from the main task list for display purposes in stats and main views
  const mainTasks = tasks.filter(t => !t.parent_task_id);
  const completedTasks = mainTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = mainTasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = mainTasks.filter(t => t.status === 'pending').length;
  const progressPercentage = mainTasks.length > 0 ? Math.round((completedTasks / mainTasks.length) * 100) : 0;

  const colorClasses = {
    blue: "bg-[#6FA6FF]",
    purple: "bg-[#456C8D]",
    green: "bg-[#6FA6FF]",
    orange: "bg-[#456C8D]",
    pink: "bg-[#6FA6FF]",
    red: "bg-[#456C8D]",
    indigo: "bg-[#6FA6FF]",
    teal: "bg-[#456C8D]",
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Projects"))}
            className="bg-white border-[#EAEAEA] dark:border-[#30363d] hover:bg-[#EAEAEA] rounded-lg h-10 w-10 md:h-12 md:w-12"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-[#456C8D] dark:text-[#8b949e]" />
          </Button>
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 w-full">
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl ${colorClasses[project.color]} flex items-center justify-center flex-shrink-0`}>
              <span className="text-xl md:text-3xl text-white font-bold">{project.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[#131A20] dark:text-white truncate">{project.name}</h1>
              <p className="text-xs sm:text-sm md:text-base text-[#456C8D] dark:text-[#8b949e] line-clamp-2">{project.description || "Sem descrição"}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowProjectForm(true)}
              className="flex-1 sm:flex-initial bg-white border-[#EAEAEA] dark:border-[#30363d] hover:bg-[#EAEAEA] rounded-lg h-9 w-9 md:h-10 md:w-10"
            >
              <Pencil className="w-4 h-4 text-[#456C8D] dark:text-[#8b949e]" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleProjectDelete}
              className="flex-1 sm:flex-initial bg-white border-[#EAEAEA] dark:border-[#30363d] hover:bg-red-50 hover:border-red-300 rounded-lg h-9 w-9 md:h-10 md:w-10 text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Project Form */}
        <AnimatePresence>
          {showProjectForm && (
            <ProjectForm
              project={project}
              onSubmit={handleProjectSubmit}
              onCancel={() => setShowProjectForm(false)}
              isLoading={updateProjectMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-[#6FA6FF]/10 border border-[#6FA6FF]/30 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                <div className="bg-white rounded-xl p-2 md:p-3 mb-2 md:mb-0 w-fit">
                  <ListTodo className="w-4 h-4 md:w-6 md:h-6 text-[#6FA6FF]" />
                </div>
                <div className="md:text-right">
                  <div className="text-2xl md:text-4xl font-bold text-[#6FA6FF]">
                    {mainTasks.length}
                  </div>
                </div>
              </div>
              <p className="text-[#456C8D] dark:text-[#8b949e] font-medium text-xs md:text-sm">Total de Tarefas</p>
            </CardContent>
          </Card>

          <Card className="bg-[#131A20]/5 border border-[#131A20]/10 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                <div className="bg-white rounded-xl p-2 md:p-3 mb-2 md:mb-0 w-fit">
                  <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-[#131A20] dark:text-white" />
                </div>
                <div className="md:text-right">
                  <div className="text-2xl md:text-4xl font-bold text-[#131A20] dark:text-white">
                    {completedTasks}
                  </div>
                </div>
              </div>
              <p className="text-[#456C8D] dark:text-[#8b949e] font-medium text-xs md:text-sm">Concluídas</p>
            </CardContent>
          </Card>

          <Card className="bg-[#456C8D]/10 border border-[#456C8D]/20 shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                <div className="bg-white rounded-xl p-2 md:p-3 mb-2 md:mb-0 w-fit">
                  <Clock className="w-4 h-4 md:w-6 md:h-6 text-[#456C8D] dark:text-[#8b949e]" />
                </div>
                <div className="md:text-right">
                  <div className="text-2xl md:text-4xl font-bold text-[#456C8D] dark:text-[#8b949e]">
                    {inProgressTasks}
                  </div>
                </div>
              </div>
              <p className="text-[#456C8D] dark:text-[#8b949e] font-medium text-xs md:text-sm">Em Andamento</p>
            </CardContent>
          </Card>

          <Card className="bg-[#EAEAEA] border border-[#EAEAEA] dark:border-[#30363d] shadow-sm hover:shadow-md transition-all rounded-xl">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                <div className="bg-white rounded-xl p-2 md:p-3 mb-2 md:mb-0 w-fit">
                  <AlertCircle className="w-4 h-4 md:w-6 md:h-6 text-[#456C8D] dark:text-[#8b949e]" />
                </div>
                <div className="md:text-right">
                  <div className="text-2xl md:text-4xl font-bold text-[#456C8D] dark:text-[#8b949e]">
                    {pendingTasks}
                  </div>
                </div>
              </div>
              <p className="text-[#456C8D] dark:text-[#8b949e] font-medium text-xs md:text-sm">Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="bg-white dark:bg-[#161b22] border border-[#EAEAEA] dark:border-[#30363d] shadow-sm rounded-xl mb-6 md:mb-8">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#131A20] dark:text-white text-sm md:text-base">Progresso do Projeto</h3>
              <span className="text-xl md:text-2xl font-bold text-[#6FA6FF]">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 md:h-3" />
            <p className="text-xs md:text-sm text-[#456C8D] dark:text-[#8b949e] mt-2">
              {completedTasks} de {mainTasks.length} tarefas concluídas
            </p>
          </CardContent>
        </Card>

        {/* Tabs with Gantt, List and Table View */}
        <Card className="shadow-sm border border-[#EAEAEA] dark:border-[#30363d] rounded-xl bg-white">
          <CardHeader className="border-b border-[#EAEAEA] dark:border-[#30363d] p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-xl md:text-2xl font-semibold text-[#131A20] dark:text-white">Tarefas do Projeto</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button
                  onClick={() => setShowModuleDialog(true)}
                  variant="outline"
                  className="w-full sm:w-auto border-[#EAEAEA] dark:border-[#30363d] text-[#456C8D] dark:text-[#8b949e] hover:bg-[#EAEAEA] rounded-lg h-10 md:h-11 text-sm"
                >
                  <Package className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  <span className="text-sm md:text-base">Adicionar Módulo</span>
                </Button>
                <Button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskForm(true);
                  }}
                  className="w-full sm:w-auto bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg h-10 md:h-11"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  <span className="text-sm md:text-base">Nova Tarefa</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="list" className="w-full">
              <div className="border-b border-[#EAEAEA] dark:border-[#30363d] px-4 md:px-6">
                <TabsList className="bg-transparent w-full sm:w-auto grid grid-cols-3 sm:flex">
                  <TabsTrigger value="list" className="flex items-center gap-2 text-xs md:text-sm data-[state=active]:border-b-2 data-[state=active]:border-[#6FA6FF]">
                    <List className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Lista</span>
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex items-center gap-2 text-xs md:text-sm data-[state=active]:border-b-2 data-[state=active]:border-[#6FA6FF]">
                    <TableIcon className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Tabela</span>
                  </TabsTrigger>
                  <TabsTrigger value="gantt" className="flex items-center gap-2 text-xs md:text-sm data-[state=active]:border-b-2 data-[state=active]:border-[#6FA6FF]">
                    <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Gantt</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list" className="p-4 md:p-6 mt-0">
                {/* TaskFormDialog will handle task creation/editing as a modal */}
                {loadingTasks ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <TaskListView
                    tasks={tasks.filter(t => !t.parent_task_id)} // Pass only main tasks to list view
                    subtasks={tasks.filter(t => t.parent_task_id)} // Pass subtasks separately
                    onEdit={handleTaskEdit}
                    onDelete={handleTaskDelete}
                    onStatusChange={handleTaskStatusChange}
                  />
                )}
              </TabsContent>

              {/* New TabsContent for Table View */}
              <TabsContent value="table" className="p-4 md:p-6 mt-0">
                {loadingTasks ? (
                  <Skeleton className="h-96 w-full rounded-xl" />
                ) : (
                  <TaskTableView
                    tasks={tasks.filter(t => !t.parent_task_id)} // Pass only main tasks to table view
                    subtasks={tasks.filter(t => t.parent_task_id)} // Pass subtasks separately
                    onEdit={handleTaskEdit}
                    onDelete={handleTaskDelete}
                    onStatusChange={handleTaskStatusChange}
                  />
                )}
              </TabsContent>

              <TabsContent value="gantt" className="p-4 md:p-6 mt-0">
                {loadingTasks ? (
                  <Skeleton className="h-96 w-full rounded-xl" />
                ) : (
                  <GanttChart tasks={tasks.filter(t => !t.parent_task_id)} projectColor={project.color} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Add Module Dialog */}
        <AddModuleDialog
          isOpen={showModuleDialog}
          onClose={() => setShowModuleDialog(false)}
          projectId={projectId}
          onSuccess={handleModuleSuccess}
        />

        {/* Task Form Dialog (for creating/editing tasks) */}
        <TaskFormDialog
          isOpen={showTaskForm}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          task={editingTask}
          projects={allProjects}
          onSubmit={handleTaskSubmit}
          isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
        />
      </div>
    </div>
  );
}