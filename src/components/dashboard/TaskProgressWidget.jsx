import React, { useMemo } from "react";
import { isToday, isThisWeek, isThisMonth, parseISO } from "date-fns";

export default function TaskProgressWidget({ tasks }) {
  const { label, completed, total, percent } = useMemo(() => {
    const todayTasks = tasks.filter(t => t.end_date && isToday(parseISO(t.end_date)));
    const todayDone = todayTasks.filter(t => t.status === "completed").length;
    if (todayTasks.length > 0) return { label: "hoje", completed: todayDone, total: todayTasks.length, percent: Math.round((todayDone / todayTasks.length) * 100) };

    const weekTasks = tasks.filter(t => t.end_date && isThisWeek(parseISO(t.end_date), { weekStartsOn: 1 }));
    const weekDone = weekTasks.filter(t => t.status === "completed").length;
    if (weekTasks.length > 0) return { label: "esta semana", completed: weekDone, total: weekTasks.length, percent: Math.round((weekDone / weekTasks.length) * 100) };

    const monthTasks = tasks.filter(t => t.end_date && isThisMonth(parseISO(t.end_date)));
    const monthDone = monthTasks.filter(t => t.status === "completed").length;
    return { label: "este mês", completed: monthDone, total: monthTasks.length, percent: monthTasks.length > 0 ? Math.round((monthDone / monthTasks.length) * 100) : 0 };
  }, [tasks]);

  const barColor = percent >= 80 ? "#131A20" : percent >= 50 ? "#456C8D" : "#6FA6FF";

  return (
    <div className="mb-5 bg-white border border-[#EAEAEA] rounded-2xl px-6 py-4 flex items-center gap-6">
      <div className="flex items-baseline gap-1.5 shrink-0">
        <span className="text-2xl font-light text-[#131A20] tabular-nums leading-none">{percent}%</span>
        <span className="text-xs font-light text-[#456C8D]">concluído {label}</span>
      </div>
      <div className="flex-1 h-1.5 bg-[#EAEAEA] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: barColor }}
        />
      </div>
      <span className="text-xs font-light text-[#456C8D] shrink-0 tabular-nums">{completed}/{total}</span>
    </div>
  );
}