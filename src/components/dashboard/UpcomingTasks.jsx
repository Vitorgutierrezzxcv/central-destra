import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2 } from "lucide-react";
import { parseISO, isBefore, startOfDay, addDays, isAfter, isToday } from "date-fns";
import TaskQuickViewModal from "./TaskQuickViewModal";

const priorityConfig = {
  low:    { label: "Baixa",  bg: "#F0F4F8", color: "#456C8D" },
  medium: { label: "Média",  bg: "#EBF3FF", color: "#6FA6FF" },
  high:   { label: "Alta",   bg: "#FEF0EE", color: "#C0392B" }
};

export default function UpcomingTasks({ tasks, projects }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const now = startOfDay(new Date());
  const in3Days = addDays(now, 3);

  const todayTasks = tasks
    .filter(task => {
      if (task.status === 'completed') return false;
      const endDate   = task.end_date   ? parseISO(task.end_date)   : null;
      const startDate = task.start_date ? parseISO(task.start_date) : null;
      if (endDate && (isBefore(endDate, now) || isToday(endDate))) return true;
      if (endDate && isAfter(endDate, now) && !isAfter(endDate, in3Days)) return true;
      if (startDate && isToday(startDate)) return true;
      return false;
    })
    .sort((a, b) => {
      const aDate = a.end_date ? parseISO(a.end_date) : (a.start_date ? parseISO(a.start_date) : null);
      const bDate = b.end_date ? parseISO(b.end_date) : (b.start_date ? parseISO(b.start_date) : null);
      if (!aDate && bDate) return 1;
      if (aDate && !bDate) return -1;
      if (!aDate && !bDate) return 0;
      return aDate - bDate;
    })
    .slice(0, 5);

  if (todayTasks.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-8 h-8 bg-[#EBF3FF] rounded-xl mx-auto mb-2 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-[#6FA6FF]" />
        </div>
        <p className="text-sm text-[#456C8D] font-light">Sem tarefas para hoje</p>
      </div>
    );
  }

  const selectedProject = selectedTask ? projects.find(p => p.id === selectedTask.project_id) : null;

  return (
    <>
      <div className="space-y-1.5">
        {todayTasks.map((task) => {
          const project  = projects.find(p => p.id === task.project_id);
          const priority = priorityConfig[task.priority] || priorityConfig.medium;
          const endDateParsed = task.end_date ? parseISO(task.end_date) : null;
          const isOverdue = endDateParsed && isBefore(endDateParsed, now) && !isToday(endDateParsed);
          const isDueSoon = !isOverdue && endDateParsed && !isBefore(endDateParsed, now) && !isAfter(endDateParsed, in3Days);

          return (
            <button
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="w-full text-left"
            >
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isOverdue ? 'border-red-200 bg-red-50/50 hover:bg-red-50' : isDueSoon ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50' : 'border-[#EAEAEA] hover:bg-[#F7F7F7]'}`}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-px" style={{ background: isOverdue ? '#C0392B' : isDueSoon ? '#D97706' : priority.color }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-normal truncate ${isOverdue ? 'text-[#C0392B]' : 'text-[#131A20]'}`}>
                    {task.title}
                  </p>
                  {project && (
                    <p className="text-xs text-[#456C8D] font-light truncate mt-0.5">{project.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isOverdue && (
                    <span className="text-[10px] font-light text-[#C0392B] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      Atrasada
                    </span>
                  )}
                  {isDueSoon && (
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      ⚠ Prazo próximo
                    </span>
                  )}
                  <span
                    className="text-[10px] font-light px-2 py-0.5 rounded-full"
                    style={{ background: priority.bg, color: priority.color }}
                  >
                    {priority.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTask && (
        <TaskQuickViewModal
          task={selectedTask}
          project={selectedProject}
          projects={projects}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}