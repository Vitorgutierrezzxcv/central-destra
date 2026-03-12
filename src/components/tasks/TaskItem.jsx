import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Trash2, Calendar, Circle, CheckCircle2, ArrowUpCircle, Flag, Clock, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { parseISO, isBefore, isToday, addDays, isAfter, startOfDay } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import TaskDescriptionDisplay from "./TaskDescriptionDisplay";
import TimeTracker from "./TimeTracker";
import SubTaskDisplay from "./SubTaskDisplay";
import TaskComments from "./TaskComments";

const statusConfig = {
  pending: {
    icon: Circle,
    label: "Pendente",
    color: "text-[#456C8D]",
    bg: "bg-[#EAEAEA]",
    borderColor: "border-[#EAEAEA]"
  },
  in_progress: {
    icon: ArrowUpCircle,
    label: "Em Andamento",
    color: "text-[#6FA6FF]",
    bg: "bg-[#6FA6FF]/10",
    borderColor: "border-[#6FA6FF]"
  },
  completed: {
    icon: CheckCircle2,
    label: "Concluída",
    color: "text-[#131A20]",
    bg: "bg-[#131A20]/10",
    borderColor: "border-[#131A20]"
  }
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-[#EAEAEA] text-[#456C8D] border-[#EAEAEA]" },
  medium: { label: "Média", color: "bg-[#6FA6FF]/10 text-[#6FA6FF] border-[#6FA6FF]/30" },
  high: { label: "Alta", color: "bg-red-100 text-red-600 border-red-200" }
};

export default function TaskItem({ task, project, onEdit, onDelete, onStatusChange }) {
  const [showFullTracker, setShowFullTracker] = React.useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const priority = priorityConfig[task.priority];

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createExecutionHistoryMutation = useMutation({
    mutationFn: (historyData) => base44.entities.TaskExecutionHistory.create(historyData),
  });

  const createPageMutation = useMutation({
    mutationFn: (pageData) => base44.entities.Page.create(pageData),
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      // Vincular página à tarefa
      base44.entities.Task.update(task.id, { linked_page_id: newPage.id });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Navegar para a página
      navigate(createPageUrl("Pages"));
    },
  });

  const handleCreateOrOpenPage = async () => {
    if (task.linked_page_id) {
      // Já tem página, abrir
      navigate(createPageUrl("Pages"));
    } else {
      // Criar nova página
      await createPageMutation.mutateAsync({
        title: `Resposta: ${task.title}`,
        icon: "📝",
        workspace_id: task.project_id,
        sort_order: 0,
      });
    }
  };

  const getUserDisplayName = (email) => {
    if (!email) return null;
    const user = users.find(u => u.email === email);
    if (!user) return email.split('@')[0]; // Fallback to username from email
    return user.display_name || user.full_name || email.split('@')[0];
  };

  const getUserInitials = (email) => {
    if (!email) return '?';
    const user = users.find(u => u.email === email);
    const name = user ? (user.display_name || user.full_name || email) : email;
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleStatusChange = async (newStatus) => {
    // Se a tarefa está sendo marcada como concluída e tem module_id (veio do backlog)
    // E se houver tempo rastreado, para evitar criar histórico de tarefas sem tempo
    if (newStatus === 'completed' && task.module_id && task.time_tracked > 0) {
      try {
        // Buscar o template original
        const templates = await base44.entities.TaskTemplate.filter({ module_id: task.module_id });
        const template = templates.find(t => t.title === task.title);
        
        if (template && project) {
          // Salvar histórico de execução
          await createExecutionHistoryMutation.mutateAsync({
            template_id: template.id,
            task_id: task.id,
            project_id: task.project_id,
            project_name: project.name,
            time_spent: task.time_tracked,
            completed_date: new Date().toISOString().split('T')[0],
            completed_by: currentUser?.email || task.assigned_to || ""
          });

          // Invalidate history query to reflect new data
          queryClient.invalidateQueries({ queryKey: ['task-execution-history'] });
        }
      } catch (error) {
        console.error('Error saving execution history:', error);
      }
    }

    onStatusChange(task, newStatus);
  };

  const assignedUserName = getUserDisplayName(task.assigned_to);
  const userInitials = getUserInitials(task.assigned_to);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={`border-l-[3px] ${status.borderColor} bg-white border border-[#EAEAEA] rounded-2xl shadow-none hover:border-[#D0D0D0] transition-all`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`mt-1 ${status.color} hover:opacity-70 transition-opacity flex-shrink-0`}>
                  <StatusIcon className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleStatusChange("pending")}>
                  <Circle className="w-4 h-4 mr-2 text-yellow-600" />
                  Marcar como Pendente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
                  <ArrowUpCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Marcar como Em Andamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  Marcar como Concluída
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                <h3 className={`text-base font-normal ${task.status === 'completed' ? 'line-through text-[#456C8D]' : 'text-[#131A20]'}`}>
                  {task.title}
                </h3>
                {task.assigned_to && assignedUserName && (
                  <div className="flex items-center gap-2 bg-[#F7F7F7] border border-[#EAEAEA] px-2.5 py-1 rounded-full w-fit flex-shrink-0">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-[10px] bg-[#6FA6FF] text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-[#131A20]">{assignedUserName}</span>
                  </div>
                )}
              </div>
              
              {task.description && (
                <div className="mb-3">
                  <TaskDescriptionDisplay description={task.description} />
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center mb-3">
                {project && (
                  <Badge variant="outline" className="bg-white border-[#EAEAEA] text-xs text-[#456C8D]">
                    {project.name}
                  </Badge>
                )}
                
                <Badge className={`${status.bg} ${status.color} border ${status.borderColor} text-xs`}>
                  {status.label}
                </Badge>
                
                <Badge variant="outline" className={`border ${priority.color} text-xs`}>
                  <Flag className="w-3 h-3 mr-1" />
                  {priority.label}
                </Badge>

                {task.linked_page_id && (
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Com Documentação
                  </Badge>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateOrOpenPage}
                  className="h-6 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  {task.linked_page_id ? (
                    <>
                      <FileText className="w-3 h-3 mr-1" />
                      Ver Página
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" />
                      Criar Página
                    </>
                  )}
                </Button>
                
                {task.start_date && (
                  <Badge variant="outline" className="bg-white border-[#EAEAEA] flex items-center gap-1 text-xs text-[#456C8D]">
                    <Calendar className="w-3 h-3" />
                    <span className="hidden sm:inline">Início: </span>
                    {task.start_date.split('-').reverse().slice(0, 2).join('/')}
                  </Badge>
                )}

                {task.end_date && (() => {
                  const endParsed = parseISO(task.end_date);
                  const now = startOfDay(new Date());
                  const in3Days = addDays(now, 3);
                  const isOverdue = isBefore(endParsed, now) && !isToday(endParsed);
                  const isDueSoon = !isOverdue && !isBefore(endParsed, now) && !isAfter(endParsed, in3Days);
                  return (
                    <>
                      <Badge variant="outline" className={`flex items-center gap-1 text-xs ${isOverdue ? 'bg-red-50 border-red-200 text-red-600' : isDueSoon ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-[#EAEAEA] text-[#456C8D]'}`}>
                        <Clock className="w-3 h-3" />
                        <span className="hidden sm:inline">Fim: </span>
                        {task.end_date.split('-').reverse().slice(0, 2).join('/')}
                      </Badge>
                      {isDueSoon && task.status !== 'completed' && (
                        <Badge className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                          ⚠ Prazo próximo
                        </Badge>
                      )}
                      {isOverdue && task.status !== 'completed' && (
                        <Badge className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                          Atrasada
                        </Badge>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* SubTask Display */}
              <SubTaskDisplay taskId={task.id} />

              {/* Time Tracker */}
              <div className="mt-3">
                {showFullTracker ? (
                  <div>
                    <TimeTracker task={task} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFullTracker(false)}
                      className="mt-2 text-xs"
                    >
                      Ocultar rastreador
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowFullTracker(true)}
                    className="w-full hover:bg-[#EAEAEA] p-2 rounded-lg transition-colors"
                  >
                    <TimeTracker task={task} compact />
                  </button>
                )}
              </div>
            </div>

            <div className="flex md:flex-col gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
                className="h-8 w-8 text-[#456C8D] hover:text-[#6FA6FF] hover:bg-[#6FA6FF]/10"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(task.id)}
                className="h-8 w-8 text-[#456C8D] hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}