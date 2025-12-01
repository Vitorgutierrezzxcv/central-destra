import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import SubTaskManager from "./SubTaskManager";

export default function TaskForm({ task, projects, onSubmit, onCancel, isLoading }) {
  const urlParams = new URLSearchParams(window.location.search);
  const currentProjectId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [currentTask, setCurrentTask] = useState(task || {
    title: "",
    description: "",
    project_id: currentProjectId || (projects.length > 0 ? projects[0].id : ""),
    assigned_to: null,
    start_date: "",
    end_date: "",
    status: "pending",
    priority: "medium",
    time_estimate: 0,
    parent_task_id: null
  });

  const [syncing, setSyncing] = useState(false);
  const [estimateHours, setEstimateHours] = useState(
    task?.time_estimate ? Math.floor(task.time_estimate / 3600) : 0
  );
  const [estimateMinutes, setEstimateMinutes] = useState(
    task?.time_estimate ? Math.floor((task.time_estimate % 3600) / 60) : 0
  );
  const [subtasks, setSubtasks] = useState([]);

  // Fetch UserProfiles - funciona para todos os usuários
  const { data: userProfiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  // Fetch current user - sempre disponível
  const { data: currentUser, isLoading: loadingCurrentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Buscar tarefas para extrair usuários existentes
  const { data: existingTasks } = useQuery({
    queryKey: ['existingTasksForUsers'],
    queryFn: () => base44.entities.Task.list(),
    initialData: [],
  });

  const allUsers = []; // Não usar User.list() pois falha para não-admins
  const loadingAllUsers = false;

  // Fetch existing subtasks if editing
  const { data: existingSubtasks } = useQuery({
    queryKey: ['subtasks', task?.id],
    queryFn: () => task?.id ? base44.entities.Task.filter({ parent_task_id: task.id }) : Promise.resolve([]),
    enabled: !!task?.id,
    initialData: [],
  });

  React.useEffect(() => {
    if (existingSubtasks && existingSubtasks.length > 0) {
      setSubtasks(existingSubtasks.map(st => ({
        id: st.id,
        title: st.title,
        status: st.status,
        priority: st.priority,
        assigned_to: st.assigned_to,
        start_date: st.start_date || "",
        end_date: st.end_date || ""
      })));
    }
  }, [existingSubtasks]);

  const loadingUsers = loadingProfiles || loadingCurrentUser || syncing;
  
  // Criar lista única de usuários, removendo duplicatas por email
  // IMPORTANTE: useMemo deve estar antes de qualquer early return
  const uniqueUsers = React.useMemo(() => {
    const userMap = new Map();
    
    // Primeiro adicionar UserProfiles
    userProfiles.forEach(profile => {
      if (profile.user_email) {
        userMap.set(profile.user_email, {
          id: profile.id,
          user_email: profile.user_email,
          display_name: profile.display_name || profile.full_name || profile.user_email.split('@')[0],
          full_name: profile.full_name || profile.user_email.split('@')[0]
        });
      }
    });
    
    // Adicionar o usuário atual (sempre disponível)
    if (currentUser && currentUser.email && !userMap.has(currentUser.email)) {
      userMap.set(currentUser.email, {
        id: currentUser.id,
        user_email: currentUser.email,
        display_name: currentUser.display_name || currentUser.full_name || currentUser.email.split('@')[0],
        full_name: currentUser.full_name || currentUser.email.split('@')[0]
      });
    }
    
    // Extrair usuários das tarefas existentes
    existingTasks.forEach(task => {
      if (task.assigned_to && !userMap.has(task.assigned_to)) {
        userMap.set(task.assigned_to, {
          id: task.assigned_to,
          user_email: task.assigned_to,
          display_name: task.assigned_to.split('@')[0],
          full_name: task.assigned_to.split('@')[0]
        });
      }
    });
    
    return Array.from(userMap.values());
  }, [userProfiles, currentUser, existingTasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentTask.title.trim() && currentTask.project_id) {
      if (currentTask.start_date && currentTask.end_date && currentTask.end_date < currentTask.start_date) {
        alert('A data de término não pode ser anterior à data de início');
        return;
      }
      
      // Calcular time_estimate em segundos
      const timeEstimateInSeconds = (estimateHours * 3600) + (estimateMinutes * 60);
      
      const taskData = {
        ...currentTask,
        time_estimate: timeEstimateInSeconds
      };

      // Se tiver callback de onSubmit customizado que retorna a tarefa criada
      try {
        await onSubmit(taskData, subtasks);
      } catch (error) {
        console.error('Error submitting task:', error);
      }
    }
  };

  const handleSyncUsers = async () => {
    setSyncing(true);
    try {
      // Recarregar a lista atual de UserProfiles para evitar duplicatas
      const currentProfiles = await base44.entities.UserProfile.list();
      const existingEmails = new Set(currentProfiles.map(p => p.user_email));
      
      // Criar apenas os perfis que não existem
      const profilesToCreate = allUsers.filter(user => !existingEmails.has(user.email));
      
      if (profilesToCreate.length > 0) {
        await base44.entities.UserProfile.bulkCreate(
          profilesToCreate.map(user => ({
            user_email: user.email,
            display_name: user.display_name || user.full_name || user.email.split('@')[0],
            full_name: user.full_name || user.email.split('@')[0],
            profile_photo_url: user.profile_photo_url || "",
            bio: user.bio || ""
          }))
        );
        
        queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
      }
    } catch (error) {
      console.error('Error syncing users:', error);
      alert('Erro ao sincronizar usuários: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const getUserDisplayName = (userProfile) => {
    return userProfile.display_name || userProfile.full_name || userProfile.user_email;
  };

  // Early return DEPOIS de todos os hooks
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 md:p-6 mb-6 md:mb-8 border border-[#EAEAEA]">
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-[#456C8D] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#131A20] mb-2">
            Nenhum projeto disponível
          </h3>
          <p className="text-[#456C8D] mb-6">
            Você precisa criar um projeto antes de adicionar tarefas
          </p>
          <Button onClick={onCancel} className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white">Entendi</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <h3 className="text-lg md:text-xl font-semibold text-[#131A20] mb-4 md:mb-6">
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
          <RichTextEditor
            value={currentTask.description}
            onChange={(value) => setCurrentTask({...currentTask, description: value})}
            placeholder="Adicione detalhes, use texto ou crie uma checklist..."
          />
        </div>

        {/* Subtasks Manager */}
        <SubTaskManager
          subtasks={subtasks}
          onChange={setSubtasks}
          inheritedData={{
            priority: currentTask.priority,
            assigned_to: currentTask.assigned_to,
            start_date: currentTask.start_date,
            end_date: currentTask.end_date
          }}
        />

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
            <div className="flex items-center justify-between">
              <Label htmlFor="assigned_to" className="text-sm font-medium">Responsável</Label>
              {uniqueUsers.length === 0 && !loadingUsers && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSyncUsers}
                  className="h-7 text-xs text-[#6FA6FF] hover:text-[#456C8D]"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Carregar usuários
                </Button>
              )}
            </div>
            <Select
              value={currentTask.assigned_to || ""}
              onValueChange={(value) => setCurrentTask({...currentTask, assigned_to: value === "none" ? null : value})}
              disabled={loadingUsers}
            >
              <SelectTrigger id="assigned_to" className="h-10 md:h-11">
                <SelectValue placeholder={loadingUsers ? "Carregando..." : "Atribuir a alguém"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {loadingUsers ? (
                  <SelectItem value={null} disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando usuários...
                    </div>
                  </SelectItem>
                ) : uniqueUsers.length === 0 ? (
                  <SelectItem value={null} disabled>
                    <div className="text-xs text-slate-500">
                      Nenhum usuário disponível
                    </div>
                  </SelectItem>
                ) : (
                  uniqueUsers.map(userProfile => (
                    <SelectItem key={userProfile.user_email} value={userProfile.user_email}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs bg-[#6FA6FF] text-white">
                            {getUserDisplayName(userProfile).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{getUserDisplayName(userProfile)}</span>
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
            <Label htmlFor="estimate_hours" className="text-sm font-medium">Estimativa (h)</Label>
            <Input
              id="estimate_hours"
              type="number"
              min="0"
              value={estimateHours}
              onChange={(e) => setEstimateHours(parseInt(e.target.value) || 0)}
              className="h-10 md:h-11 text-sm"
              placeholder="Horas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimate_minutes" className="text-sm font-medium">Estimativa (m)</Label>
            <Input
              id="estimate_minutes"
              type="number"
              min="0"
              max="59"
              value={estimateMinutes}
              onChange={(e) => setEstimateMinutes(parseInt(e.target.value) || 0)}
              className="h-10 md:h-11 text-sm"
              placeholder="Minutos"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            className="w-full sm:w-auto bg-[#6FA6FF] hover:bg-[#456C8D] text-white h-10 md:h-11"
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