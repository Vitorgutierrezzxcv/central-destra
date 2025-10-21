import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
    initialData: [],
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
    initialData: [],
  });

  const createProjectMutation = useMutation({
    mutationFn: (projectData) => base44.entities.Project.create(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
      setEditingProject(null);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, projectData }) => base44.entities.Project.update(id, projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
      setEditingProject(null);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
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
      // Delete all tasks associated with this project
      const projectTasks = tasks.filter(t => t.project_id === projectId);
      await Promise.all(projectTasks.map(task => base44.entities.Task.delete(task.id)));
      // Delete the project
      deleteProjectMutation.mutate(projectId);
    }
  };

  const getProjectStats = (projectId) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    return {
      total: projectTasks.length,
      completed,
      percentage: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0
    };
  };

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Projetos</h1>
            <p className="text-slate-600">Gerencie todos os seus projetos em um só lugar</p>
          </div>
          <Button 
            onClick={() => {
              setEditingProject(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Projeto
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200"
            />
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <ProjectForm
              project={editingProject}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingProject(null);
              }}
              isLoading={createProjectMutation.isPending || updateProjectMutation.isPending}
            />
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  stats={getProjectStats(project.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm ? 'Tente buscar com outros termos' : 'Crie seu primeiro projeto para começar'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Projeto
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}