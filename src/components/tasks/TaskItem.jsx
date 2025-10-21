import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar, Circle, CheckCircle2, ArrowUpCircle, Flag, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const priority = priorityConfig[task.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={`border-l-4 ${status.borderColor} shadow-md hover:shadow-lg transition-all bg-white/80 backdrop-blur-sm`}>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`mt-1 ${status.color} hover:opacity-70 transition-opacity`}>
                    <StatusIcon className="w-6 h-6" />
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

              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-1 ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  {task.title}
                </h3>
                
                {task.description && (
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 items-center">
                  {project && (
                    <Badge variant="outline" className="bg-white border-slate-200">
                      {project.name}
                    </Badge>
                  )}
                  
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
                      Início: {new Date(task.start_date).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}

                  {task.end_date && (
                    <Badge variant="outline" className="bg-white border-slate-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Fim: {new Date(task.end_date).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(task.id)}
                className="text-slate-600 hover:text-red-600 hover:bg-red-50"
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