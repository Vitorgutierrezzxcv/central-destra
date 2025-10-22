
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Added Avatar imports
import { AlertCircle, Loader2 } from "lucide-react"; // Added Loader2 import, removed X, Save, User

export default function TaskForm({ task, projects, onSubmit, onCancel, isLoading }) {
  const urlParams = new URLSearchParams(window.location.search);
  const currentProjectId = urlParams.get('id');

  // Renamed formData to currentTask
  const [currentTask, setCurrentTask] = useState(task || {
    title: "",
    description: "",
    // Project ID logic changed slightly by outline - always show select, but default to currentProjectId if available
    project_id: currentProjectId || (projects.length > 0 ? projects[0].id : ""),
    assigned_to: null, // Changed from "" to null for Select component compatibility
    start_date: "",
    end_date: "",
    status: "pending", // Status field removed from form, but kept in initial state for existing tasks
    priority: "medium"
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Use currentTask instead of formData
    if (currentTask.title.trim() && currentTask.project_id) {
      if (currentTask.start_date && currentTask.end_date && currentTask.end_date < currentTask.start_date) {
        alert('A data de término não pode ser anterior à data de início');
        return;
      }
      onSubmit(currentTask); // Pass currentTask
    }
  };

  // Helper function to get user display name - still useful for AvatarFallback
  const getUserDisplayName = (user) => {
    return user.display_name || user.full_name || user.email;
  };

  // Original Card component for no projects message, preserving functionality
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-slate-200">
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Nenhum projeto disponível
          </h3>
          <p className="text-slate-600 mb-6">
            Você precisa criar um projeto antes de adicionar tarefas
          </p>
          <Button onClick={onCancel}>Entendi</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-slate-200"
    >
      <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4 md:mb-6">
        {task ? 'Editar Tarefa' : 'Nova Tarefa'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">Título da Tarefa *</Label>
          <Input
            id="title"
            placeholder="O que precisa ser feito?"
            value={currentTask.title}
            onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
            required
            className="h-10 md:h-11 text-sm md:text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
          <Textarea
            id="description"
            placeholder="Adicione detalhes sobre a tarefa..."
            value={currentTask.description}
            onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
            className="min-h-[80px] md:min-h-[100px] resize-none text-sm md:text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="project" className="text-sm font-medium">Projeto *</Label>
            <Select
              value={currentTask.project_id}
              onValueChange={(value) => setCurrentTask({...currentTask, project_id: value})}
              required
            >
              <SelectTrigger id="project" className="h-10 md:h-11">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to" className="text-sm font-medium">Responsável</Label>
            <Select
              value={currentTask.assigned_to || ""}
              onValueChange={(value) => setCurrentTask({...currentTask, assigned_to: value})}
            >
              <SelectTrigger id="assigned_to" className="h-10 md:h-11">
                <SelectValue placeholder="Atribuir a alguém" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Nenhum</SelectItem>
                {loadingUsers ? (
                  <SelectItem value={null} disabled>Carregando...</SelectItem>
                ) : (
                  users.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getUserDisplayName(user).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{getUserDisplayName(user)}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
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
            <Label htmlFor="start_date" className="text-sm font-medium">Data de Início</Label>
            <Input
              id="start_date"
              type="date"
              value={currentTask.start_date}
              onChange={(e) => setCurrentTask({...currentTask, start_date: e.target.value})}
              className="h-10 md:h-11 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date" className="text-sm font-medium">Data de Término</Label>
            <Input
              id="end_date"
              type="date"
              value={currentTask.end_date}
              onChange={(e) => setCurrentTask({...currentTask, end_date: e.target.value})}
              min={currentTask.start_date}
              className="h-10 md:h-11 text-sm"
            />
          </div>
          {/* Original Status Select component has been removed as per outline */}
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
            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 h-10 md:h-11"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {task ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              <>
                {task ? 'Salvar Alterações' : 'Criar Tarefa'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
