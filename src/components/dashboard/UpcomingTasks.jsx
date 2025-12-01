import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, Flag, CheckCircle2 } from "lucide-react";
import { format, isToday, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityConfig = {
  low: { label: "Baixa", color: "bg-[#EAEAEA] text-[#456C8D] dark:text-[#8b949e]" },
  medium: { label: "Média", color: "bg-[#6FA6FF]/20 text-[#6FA6FF]" },
  high: { label: "Alta", color: "bg-red-100 text-red-600" }
};

export default function UpcomingTasks({ tasks, projects }) {
  const now = startOfDay(new Date());
  
  // Filtrar tarefas de hoje ou atrasadas
  const todayTasks = tasks
    .filter(task => {
      if (task.status === 'completed') return false;
      const endDate = task.end_date ? parseISO(task.end_date) : null;
      const startDate = task.start_date ? parseISO(task.start_date) : null;
      // Incluir atrasadas, hoje ou próximas
      if (endDate && (isBefore(endDate, now) || isToday(endDate))) return true;
      if (startDate && isToday(startDate)) return true;
      return false;
    })
    .sort((a, b) => {
      // Atrasadas primeiro, depois por data mais próxima
      const aDate = a.end_date ? parseISO(a.end_date) : (a.start_date ? parseISO(a.start_date) : null);
      const bDate = b.end_date ? parseISO(b.end_date) : (b.start_date ? parseISO(b.start_date) : null);
      if (!aDate && bDate) return 1;
      if (aDate && !bDate) return -1;
      if (!aDate && !bDate) return 0;
      return aDate - bDate;
    })
    .slice(0, 4);

  if (todayTasks.length === 0) {
    return (
      <div className="text-center py-6 md:py-8">
        <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-[#6FA6FF] mx-auto mb-3" />
        <p className="text-sm md:text-base text-[#456C8D] dark:text-[#8b949e]">Nenhuma tarefa para hoje! 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {todayTasks.map((task, index) => {
        const project = projects.find(p => p.id === task.project_id);
        const priority = priorityConfig[task.priority];
        const time = task.start_date ? format(parseISO(task.start_date), "HH:mm") : format(parseISO(task.end_date), "HH:mm");

        return (
          <Link 
            key={task.id}
            to={`${createPageUrl("ProjectDetail")}?id=${task.project_id}`}
            className="block"
          >
            <div className="bg-white dark:bg-[#161b22] p-3 md:p-4 rounded-xl border border-[#EAEAEA] dark:border-[#30363d] hover:shadow-md hover:border-[#6FA6FF]/30 transition-all cursor-pointer">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="bg-[#EAEAEA] dark:bg-[#21262d] rounded-lg md:rounded-xl p-1.5 md:p-2">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-[#456C8D] dark:text-[#8b949e]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                    <span className="text-xs md:text-sm font-semibold text-[#456C8D] dark:text-[#8b949e]">{time}</span>
                    <Badge className={`${priority.color} rounded-full text-xs px-1.5 md:px-2 py-0.5`}>
                      {priority.label}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm md:text-base text-[#131A20] dark:text-white mb-0.5 md:mb-1 line-clamp-1">{task.title}</h4>
                  {project && (
                    <p className="text-xs text-[#456C8D] dark:text-[#8b949e] line-clamp-1">{project.name}</p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}