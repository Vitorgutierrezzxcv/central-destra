import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, Flag, CheckCircle2 } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-200 text-slate-700" },
  medium: { label: "Média", color: "bg-blue-200 text-blue-700" },
  high: { label: "Alta", color: "bg-red-200 text-red-700" }
};

export default function UpcomingTasks({ tasks, projects }) {
  const todayTasks = tasks
    .filter(task => {
      if (task.status === 'completed') return false;
      const startDate = task.start_date ? parseISO(task.start_date) : null;
      const endDate = task.end_date ? parseISO(task.end_date) : null;
      return (startDate && isToday(startDate)) || (endDate && isToday(endDate));
    })
    .sort((a, b) => {
      const timeA = a.start_date ? new Date(a.start_date).getTime() : new Date(a.end_date).getTime();
      const timeB = b.start_date ? new Date(b.start_date).getTime() : new Date(b.end_date).getTime();
      return timeA - timeB;
    })
    .slice(0, 4);

  if (todayTasks.length === 0) {
    return (
      <div className="text-center py-6 md:py-8">
        <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-green-400 mx-auto mb-3" />
        <p className="text-sm md:text-base text-slate-600">Nenhuma tarefa para hoje! 🎉</p>
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
            <div className="bg-gradient-to-r from-slate-50 to-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="bg-white rounded-lg md:rounded-xl p-1.5 md:p-2 shadow-sm">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                    <span className="text-xs md:text-sm font-semibold text-slate-500">{time}</span>
                    <Badge className={`${priority.color} rounded-full text-xs px-1.5 md:px-2 py-0.5`}>
                      {priority.label}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm md:text-base text-slate-900 mb-0.5 md:mb-1 line-clamp-1">{task.title}</h4>
                  {project && (
                    <p className="text-xs text-slate-500 line-clamp-1">{project.name}</p>
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