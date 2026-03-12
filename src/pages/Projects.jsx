import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, FolderKanban, AlertCircle, CheckCircle2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence } from "framer-motion";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectForm from "../components/projects/ProjectForm";

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
    initialData: []
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
    initialData: []
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const createProjectMutation = useMutation({
    mutationFn: (projectData) => base44.entities.Project.create(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
      setEditingProject(null);
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, projectData }) => base44.entities.Project.update(id, projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
      setEditingProject(null);
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleSubmit = (projectData) => {
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, projectData });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Tem certeza que deseja excluir este projeto? Todas as tarefas associadas também serão removidas.')) {
      const projectTasks = tasks.filter((t) => t.project_id === projectId);
      await Promise.all(projectTasks.map((task) => base44.entities.Task.delete(task.id)));
      deleteProjectMutation.mutate(projectId);
    }
  };

  const getProjectStats = (projectId) => {
    const projectTasks = tasks.filter((t) => t.project_id === projectId);
    const completed = projectTasks.filter((t) => t.status === 'completed').length;
    const now = new Date();
    const overdue = projectTasks.filter((t) =>
    t.status !== 'completed' &&
    t.end_date &&
    new Date(t.end_date) < now
    ).length;
    return {
      total: projectTasks.length,
      completed,
      overdue,
      percentage: projectTasks.length > 0 ? Math.round(completed / projectTasks.length * 100) : 0
    };
  };

  const getUserDisplayName = (email) => {
    if (!email) return null;
    const user = users.find((u) => u.email === email);
    return user ? user.display_name || user.full_name || email.split('@')[0] : email.split('@')[0];
  };

  const filteredProjects = projects.filter((project) =>
  project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProjects = filteredProjects.filter((p) => p.status === 'active').length;
  const completedProjects = filteredProjects.filter((p) => p.status === 'completed').length;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-slate-950 rounded-xl w-12 h-12 md:w-16 md:h-16 md:rounded-2xl flex items-center justify-center">
              <FolderKanban className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-light text-slate-900">Projetos</h1>
              <p className="text-sm md:text-base text-slate-500 font-light">
                {activeProjects} ativo{activeProjects !== 1 ? 's' : ''} • {completedProjects} concluído{completedProjects !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 md:w-5 md:h-5" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 bg-white border-slate-200 h-10 md:h-11 text-sm md:text-base rounded-lg text-slate-900 font-light placeholder:text-slate-400" />

            </div>
            <Button
              onClick={() => {
                setEditingProject(null);
                setShowForm(true);
              }} className="bg-slate-950 text-white px-6 py-2 text-sm font-light rounded-lg inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow hover:bg-blue-700 h-10 md:h-11">


              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="text-sm md:text-base font-medium">Novo Projeto</span>
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showForm &&
          <ProjectForm
            project={editingProject}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingProject(null);
            }}
            isLoading={createProjectMutation.isPending || updateProjectMutation.isPending} />

          }
        </AnimatePresence>

        {isLoading ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
             {[1, 2, 3].map((i) =>
          <div key={i} className="h-56 bg-slate-200 rounded-xl animate-pulse" />
          )}
           </div> :
        filteredProjects.length > 0 ?
        <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <AnimatePresence>
                {filteredProjects.map((project) =>
              <ProjectCard
                key={project.id}
                project={project}
                stats={getProjectStats(project.id)}
                onEdit={handleEdit}
                onDelete={handleDelete} />

              )}
              </AnimatePresence>
            </div>

            {/* Detalhes de Tarefas Atrasadas */}
             <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6">
              <h2 className="text-lg md:text-xl font-light text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="text-slate-950 lucide lucide-circle-alert w-5 h-5" />
                Tarefas Atrasadas por Projeto
              </h2>
              <div className="space-y-3">
                {filteredProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.project_id === project.id && !t.parent_task_id);
                const now = new Date();
                const overdueTasks = projectTasks.filter((t) =>
                t.status !== 'completed' &&
                t.end_date &&
                new Date(t.end_date) < now
                );

                if (overdueTasks.length === 0) {
                  return (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-light text-slate-900">{project.name}</p>
                          <p className="text-xs text-slate-500 font-light">Nenhuma tarefa atrasada</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>);

                }

                return (
                  <div key={project.id} className="border border-slate-200 rounded-lg p-3 md:p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-light text-slate-900">{project.name}</h3>
                        <Badge variant="destructive" className="bg-slate-200 text-slate-950 px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow hover:bg-destructive/80 border-red-200">
                          {overdueTasks.length} atrasada{overdueTasks.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {/* Responsável do Projeto */}
                      {project.project_owner_internal &&
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded font-light">
                          <User className="w-4 h-4" />
                          <span>{getUserDisplayName(project.project_owner_internal)}</span>
                        </div>
                    }

                      {/* Lista de Tarefas Atrasadas */}
                      <div className="space-y-2">
                        {overdueTasks.slice(0, 3).map((task) =>
                      <div key={task.id} className="text-sm bg-red-50 border border-red-200 rounded p-2 flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-slate-950 font-light truncate">{task.title}</p>
                              <p className="text-slate-950 text-xs font-light">Prazo: {new Date(task.end_date).toLocaleDateString('pt-BR')}</p>
                            </div>
                            {task.assigned_to &&
                        <span className="text-xs bg-red-200 text-red-900 px-2 py-1 rounded whitespace-nowrap flex-shrink-0 font-light">
                                {getUserDisplayName(task.assigned_to)}
                              </span>
                        }
                          </div>
                      )}
                        {overdueTasks.length > 3 &&
                      <p className="text-xs text-slate-500 py-1 font-light">+{overdueTasks.length - 3} tarefa{overdueTasks.length > 4 ? 's' : ''} atrasada{overdueTasks.length > 4 ? 's' : ''}</p>
                      }
                      </div>
                    </div>);

              })}
              </div>
            </div>
          </div> :

        <div className="flex flex-col items-center justify-center py-16 md:py-24">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-200 rounded-xl md:rounded-2xl flex items-center justify-center mb-6">
              <FolderKanban className="w-10 h-10 md:w-16 md:h-16 text-slate-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-light text-slate-900 mb-2">
              {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
            </h3>
            <p className="text-sm md:text-base text-slate-500 mb-6 md:mb-8 text-center max-w-md px-4 font-light">
              {searchTerm ?
            'Tente buscar com outros termos ou crie um novo projeto' :
            'Crie seu primeiro projeto e comece a organizar suas tarefas'}
            </p>
            {!searchTerm &&
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-11 md:h-12 px-6 md:px-8 text-sm md:text-base font-light">

                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Projeto
              </Button>
          }
          </div>
        }
      </div>
    </div>);

}