import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { sortTasksByUrgency } from "../tasks/taskSortUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Pencil, 
  Trash2, 
  Calendar, 
  Circle, 
  CheckCircle2, 
  ArrowUpCircle,
  Flag,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import TaskDescriptionDisplay from "../tasks/TaskDescriptionDisplay";
import TimeTracker from "../tasks/TimeTracker";

const statusConfig = {
  pending: {
    icon: Circle,
    label: "Pendente",
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    borderColor: "border-yellow-200"
  },
  in_progress: {
    icon: ArrowUpCircle,
    label: "Em Andamento",
    color: "text-blue-600",
    bg: "bg-blue-100",
    borderColor: "border-blue-200"
  },
  completed: {
    icon: CheckCircle2,
    label: "Concluída",
    color: "text-green-600",
    bg: "bg-green-100",
    borderColor: "border-green-200"
  }
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: { label: "Média", color: "bg-blue-100 text-blue-700 border-blue-200" },
  high: { label: "Alta", color: "bg-red-100 text-red-700 border-red-200" }
};

// Função para formatar data sem conversão de timezone
const formatDateOnly = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function TaskListView({ tasks: unsortedTasks, onEdit, onDelete, onStatusChange }) {
  const tasks = sortTasksByUrgency(unsortedTasks);
  const [expandedTasks, setExpandedTasks] = React.useState(new Set());
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    initialData: [],
  });

  const createExecutionHistoryMutation = useMutation({
    mutationFn: (historyData) => base44.entities.TaskExecutionHistory.create(historyData),
  });

  const getUserDisplayName = (email) => {
    if (!email) return null;
    const user = users.find(u => u.email === email);
    if (!user) return email.split('@')[0]; // Fallback para parte do email
    return user.display_name || user.full_name || email.split('@')[0];
  };

  const getUserInitials = (email) => {
    if (!email) return '?';
    const user = users.find(u => u.email === email);
    const name = user ? (user.display_name || user.full_name || email) : email;
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Function to toggle expanded state for a task
  const toggleTaskExpanded = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleStatusChange = async (task, newStatus) => {
    // Se a tarefa está sendo marcada como concluída e tem module_id (veio do backlog)
    if (newStatus === 'completed' && task.module_id && task.time_tracked > 0) {
      try {
        const templates = await base44.entities.TaskTemplate.filter({ module_id: task.module_id });
        const template = templates.find(t => t.title === task.title);
        const project = projects.find(p => p.id === task.project_id);
        
        if (template && project) {
          await createExecutionHistoryMutation.mutateAsync({
            template_id: template.id,
            task_id: task.id,
            project_id: task.project_id,
            project_name: project.name,
            time_spent: task.time_tracked,
            completed_date: new Date().toISOString().split('T')[0],
            completed_by: currentUser?.email || task.assigned_to || ""
          });

          queryClient.invalidateQueries({ queryKey: ['task-execution-history'] });
        }
      } catch (error) {
        console.error('Error saving execution history:', error);
      }
    }

    onStatusChange(task, newStatus);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Circle className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Nenhuma tarefa ainda</h3>
        <p>Crie a primeira tarefa para este projeto</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {tasks.map(task => {
          const status = statusConfig[task.status];
          const StatusIcon = status.icon;
          const priority = priorityConfig[task.priority];
          const assignedUserName = getUserDisplayName(task.assigned_to);
          const userInitials = getUserInitials(task.assigned_to);
          const isExpanded = expandedTasks.has(task.id);

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`
                p-4 rounded-lg border-l-4 ${status.borderColor} 
                bg-slate-50 hover:bg-white hover:shadow-md transition-all
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`mt-1 ${status.color} hover:opacity-70 transition-opacity`}>
                        <StatusIcon className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleStatusChange(task, "pending")}>
                        <Circle className="w-4 h-4 mr-2 text-yellow-600" />
                        Pendente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(task, "in_progress")}>
                        <ArrowUpCircle className="w-4 h-4 mr-2 text-blue-600" />
                        Em Andamento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(task, "completed")}>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                        Concluída
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>
                      {task.assigned_to && assignedUserName && (
                        <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-slate-200 flex-shrink-0">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{assignedUserName}</span>
                        </div>
                      )}
                    </div>
                    
                    {task.description && (
                      <div className="mb-2">
                        <TaskDescriptionDisplay description={task.description} />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${status.bg} ${status.color} border ${status.borderColor}`}>
                        {status.label}
                      </Badge>
                      
                      <Badge variant="outline" className={`border ${priority.color}`}>
                        <Flag className="w-3 h-3 mr-1" />
                        {priority.label}
                      </Badge>
                      
                      {task.start_date && (
                        <Badge variant="outline" className="bg-white border-slate-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateOnly(task.start_date)}
                        </Badge>
                      )}

                      {task.end_date && (
                        <Badge variant="outline" className="bg-white border-slate-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateOnly(task.end_date)}
                        </Badge>
                      )}
                    </div>

                    {/* Time Tracker */}
                    <div className="mt-3">
                      {isExpanded ? (
                        <div>
                          <TimeTracker task={task} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTaskExpanded(task.id)}
                            className="mt-2 text-xs"
                          >
                            Ocultar rastreador
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleTaskExpanded(task.id)}
                          className="w-full hover:bg-white p-2 rounded-lg transition-colors"
                        >
                          <TimeTracker task={task} compact />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(task)}
                    className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(task.id)}
                    className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}