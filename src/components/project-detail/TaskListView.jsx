import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Trash2, 
  Calendar, 
  Circle, 
  CheckCircle2, 
  ArrowUpCircle,
  Flag 
} from "lucide-react";
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

export default function TaskListView({ tasks, onEdit, onDelete, onStatusChange }) {
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
                      <DropdownMenuItem onClick={() => onStatusChange(task, "pending")}>
                        <Circle className="w-4 h-4 mr-2 text-yellow-600" />
                        Pendente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(task, "in_progress")}>
                        <ArrowUpCircle className="w-4 h-4 mr-2 text-blue-600" />
                        Em Andamento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(task, "completed")}>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                        Concluída
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    
                    {task.description && (
                      <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${status.bg} ${status.color} border ${status.borderColor}`}>
                        {status.label}
                      </Badge>
                      
                      <Badge variant="outline" className={`border ${priority.color}`}>
                        <Flag className="w-3 h-3 mr-1" />
                        {priority.label}
                      </Badge>
                      
                      {task.scheduled_date && (
                        <Badge variant="outline" className="bg-white border-slate-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.scheduled_date).toLocaleDateString('pt-BR')}
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