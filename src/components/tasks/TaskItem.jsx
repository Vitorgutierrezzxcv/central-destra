
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Trash2, Calendar, Circle, CheckCircle2, ArrowUpCircle, Flag, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import TaskDescriptionDisplay from "./TaskDescriptionDisplay";
import TimeTracker from "./TimeTracker";

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

export default function TaskItem({ task, project, onEdit, onDelete, onStatusChange }) {
  const [showFullTracker, setShowFullTracker] = React.useState(false);

  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const priority = priorityConfig[task.priority];

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

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

  const assignedUserName = getUserDisplayName(task.assigned_to);
  const userInitials = getUserInitials(task.assigned_to);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={`border-l-4 ${status.borderColor} shadow-md hover:shadow-lg transition-all bg-white/80 backdrop-blur-sm`}>
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`mt-1 ${status.color} hover:opacity-70 transition-opacity flex-shrink-0`}>
                  <StatusIcon className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onStatusChange(task, "pending")}>
                  <Circle className="w-4 h-4 mr-2 text-yellow-600" />
                  Marcar como Pendente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(task, "in_progress")}>
                  <ArrowUpCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Marcar como Em Andamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange(task, "completed")}>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  Marcar como Concluída
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                <h3 className={`text-base md:text-lg font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  {task.title}
                </h3>
                {task.assigned_to && assignedUserName && (
                  <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1.5 rounded-full w-fit flex-shrink-0">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-slate-700">{assignedUserName}</span>
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
                  <Badge variant="outline" className="bg-white border-slate-200 text-xs">
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
                
                {task.start_date && (
                  <Badge variant="outline" className="bg-white border-slate-200 flex items-center gap-1 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span className="hidden sm:inline">Início: </span>
                    {new Date(task.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </Badge>
                )}

                {task.end_date && (
                  <Badge variant="outline" className="bg-white border-slate-200 flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    <span className="hidden sm:inline">Fim: </span>
                    {new Date(task.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </Badge>
                )}
              </div>

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
                    className="w-full hover:bg-slate-50 p-2 rounded-lg transition-colors"
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
