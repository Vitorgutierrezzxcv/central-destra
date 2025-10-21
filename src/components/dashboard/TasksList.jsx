import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Calendar, Flag, FolderKanban, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200"
  },
  in_progress: {
    label: "Em Andamento",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  completed: {
    label: "Concluída",
    color: "bg-green-100 text-green-700 border-green-200"
  }
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-100 text-slate-700" },
  medium: { label: "Média", color: "bg-blue-100 text-blue-700" },
  high: { label: "Alta", color: "bg-red-100 text-red-700" }
};

export default function TasksList({ tasks, projects, viewMode, selectedDate }) {
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(a.start_date || a.end_date || a.created_date);
    const dateB = new Date(b.start_date || b.end_date || b.created_date);
    return dateA - dateB;
  });

  const getViewLabel = () => {
    switch (viewMode) {
      case "day":
        return format(selectedDate, "dd 'de' MMMM", { locale: ptBR });
      case "week":
        return "Esta Semana";
      case "month":
        return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
      default:
        return "";
    }
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Nenhuma tarefa para {getViewLabel()}
        </h3>
        <p className="text-slate-600">
          Aproveite este período livre ou adicione novas tarefas!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">
          Tarefas de {getViewLabel()}
        </h3>
        <Badge variant="outline" className="bg-slate-50">
          {sortedTasks.length} tarefa(s)
        </Badge>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {sortedTasks.map((task, index) => {
            const project = projects.find(p => p.id === task.project_id);
            const status = statusConfig[task.status];
            const priority = priorityConfig[task.priority];

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`${createPageUrl("ProjectDetail")}?id=${task.project_id}`}
                  className="block p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-slate-900 flex-1">
                      {task.title}
                    </h4>
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  </div>

                  {task.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 items-center">
                    {project && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <FolderKanban className="w-3 h-3" />
                        {project.name}
                      </Badge>
                    )}

                    <Badge className={`text-xs border ${status.color}`}>
                      {status.label}
                    </Badge>

                    <Badge variant="outline" className={`text-xs ${priority.color}`}>
                      <Flag className="w-3 h-3 mr-1" />
                      {priority.label}
                    </Badge>

                    {task.start_date && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.start_date), "dd/MM", { locale: ptBR })}
                      </Badge>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}