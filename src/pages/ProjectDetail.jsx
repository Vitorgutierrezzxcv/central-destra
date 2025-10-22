
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
  ListTodo // Added ListTodo icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence } from "framer-motion";

import GanttChart from "../components/project-detail/GanttChart";
import TaskListView from "../components/project-detail/TaskListView";
import TaskForm from "../components/tasks/TaskForm";
import ProjectForm from "../components/projects/ProjectForm";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskForm(false);
      setEditingTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => base44.entities.Task.update(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskForm(false);
      setEditingTask(null);
    },
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

  const handleTaskSubmit = (taskData) => {
    const dataWithProject = { ...taskData, project_id: projectId };
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, taskData: dataWithProject });
    } else {
      createTaskMutation.mutate(dataWithProject);
    }
  };

  const handleProjectSubmit = (projectData) => {
    updateProjectMutation.mutate({ id: projectId, projectData });
  };

  const handleTaskEdit = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleTaskDelete = (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
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

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Projeto não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl("Projects"))}>
            Voltar para Projetos
          </Button>
        </div>
      </div>
    );
  }

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-16 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Projeto não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl("Projects"))}>
            Voltar para Projetos
          </Button>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const colorClasses = {
    blue: "from-blue-400 to-blue-600",
    purple: "from-purple-400 to-purple-600",
    green: "from-green-400 to-green-600",
    orange: "from-orange-400 to-orange-600",
    pink: "from-pink-400 to-pink-600",
    red: "from-red-400 to-red-600",
    indigo: "from-indigo-400 to-indigo-600",
    teal: "from-teal-400 to-teal-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Projects"))}
            className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg border-slate-200 rounded-full h-10 w-10 md:h-12 md:w-12"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3 md:gap-4">
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-gradient-to-br ${colorClasses[project.color]} flex items-center justify-center shadow-lg`}>
              <span className="text-xl md:text-3xl text-white font-bold">{project.name[0]}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">{project.name}</h1>
              <p className="text-sm md:text-base text-slate-600">{project.description || "Sem descrição"}</p>
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowProjectForm(true)}
              className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg border-slate-200 rounded-full h-9 w-9 md:h-10 md:w-10"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleProjectDelete}
              className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg border-slate-200 rounded-full h-9 w-9 md:h-10 md:w-10 text-red-600 hover:text-red-700 hover:border-red-300"
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
          <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-none shadow-lg hover:shadow-xl transition-all rounded-2xl md:rounded-3xl">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                <div className="bg-white/80 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-md mb-2 md:mb-0 w-fit">
                  <ListTodo className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div className="md:text-right">
                  <div className="text-2xl md:text-4xl font-bold text-blue-600">
                    {tasks.length}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 font-medium text-xs md:text-sm">Total de Tarefas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-100 to-green-200 border-none shadow-lg hover:shadow-xl transition-all rounded-2xl md:rounded-3xl">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                <div className="bg-white/80 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-md mb-2 md:mb-0 w-fit">
                  <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                </div>
                <div className="md:text-right">
                  <div className="text-2xl md:text-4xl font-bold text-green-600">
                    {completedTasks}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 font-medium text-xs md:text-sm">Concluídas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-none shadow-lg hover:shadow-xl transition-all rounded-2xl md:rounded-3xl">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                <div className="bg-white/80 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-md mb-2 md:mb-0 w-fit">
                  <Clock className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                </div>
                <div className="md:text-right">
                  <div className="text-2xl md:text-4xl font-bold text-purple-600">
                    {inProgressTasks}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 font-medium text-xs md:text-sm">Em Andamento</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-none shadow-lg hover:shadow-xl transition-all rounded-2xl md:rounded-3xl">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                <div className="bg-white/80 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-md mb-2 md:mb-0 w-fit">
                  <AlertCircle className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
                </div>
                <div className="md:text-right">
                  <div className="text-2xl md:text-4xl font-bold text-yellow-600">
                    {pendingTasks}
                  </div>
                </div>
              </div>
              <p className="text-slate-700 font-medium text-xs md:text-sm">Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-none rounded-2xl md:rounded-3xl mb-6 md:mb-8">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 text-sm md:text-base">Progresso do Projeto</h3>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 md:h-3" />
            <p className="text-xs md:text-sm text-slate-600 mt-2">
              {completedTasks} de {tasks.length} tarefas concluídas
            </p>
          </CardContent>
        </Card>

        {/* Tabs with Gantt and List View */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-none rounded-2xl md:rounded-3xl">
          <CardHeader className="border-b border-slate-200 p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-900">Tarefas do Projeto</CardTitle>
              <Button 
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskForm(true);
                }}
                className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg rounded-full h-10 md:h-11"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                <span className="text-sm md:text-base">Nova Tarefa</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="list" className="w-full">
              <div className="border-b border-slate-200 px-4 md:px-6">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="list" className="flex items-center gap-2 text-xs md:text-sm">
                    <List className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Lista de Tarefas</span>
                    <span className="sm:hidden">Lista</span>
                  </TabsTrigger>
                  <TabsTrigger value="gantt" className="flex items-center gap-2 text-xs md:text-sm">
                    <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Gráfico de Gantt</span>
                    <span className="sm:hidden">Gantt</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list" className="p-4 md:p-6 mt-0">
                <AnimatePresence>
                  {showTaskForm && (
                    <div className="mb-6">
                      <TaskForm
                        task={editingTask}
                        projects={allProjects}
                        onSubmit={handleTaskSubmit}
                        onCancel={() => {
                          setShowTaskForm(false);
                          setEditingTask(null);
                        }}
                        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
                      />
                    </div>
                  )}
                </AnimatePresence>

                {loadingTasks ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <TaskListView
                    tasks={tasks}
                    onEdit={handleTaskEdit}
                    onDelete={handleTaskDelete}
                    onStatusChange={handleTaskStatusChange}
                  />
                )}
              </TabsContent>

              <TabsContent value="gantt" className="p-4 md:p-6 mt-0">
                {loadingTasks ? (
                  <Skeleton className="h-96 w-full rounded-2xl" />
                ) : (
                  <GanttChart tasks={tasks} projectColor={project.color} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
