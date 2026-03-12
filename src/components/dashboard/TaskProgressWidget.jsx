import React, { useMemo } from "react";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { isToday, isThisWeek, isThisMonth, parseISO } from "date-fns";

export default function TaskProgressWidget({ tasks }) {
  const { label, completed, total, percent, period } = useMemo(() => {
    const todayTasks = tasks.filter(t => t.end_date && isToday(parseISO(t.end_date)));
    const todayDone = todayTasks.filter(t => t.status === "completed").length;

    if (todayTasks.length > 0) {
      return {
        label: "Tarefas de hoje",
        completed: todayDone,
        total: todayTasks.length,
        percent: Math.round((todayDone / todayTasks.length) * 100),
        period: "hoje"
      };
    }

    const weekTasks = tasks.filter(t => t.end_date && isThisWeek(parseISO(t.end_date), { weekStartsOn: 1 }));
    const weekDone = weekTasks.filter(t => t.status === "completed").length;

    if (weekTasks.length > 0) {
      return {
        label: "Tarefas desta semana",
        completed: weekDone,
        total: weekTasks.length,
        percent: Math.round((weekDone / weekTasks.length) * 100),
        period: "semana"
      };
    }

    const monthTasks = tasks.filter(t => t.end_date && isThisMonth(parseISO(t.end_date)));
    const monthDone = monthTasks.filter(t => t.status === "completed").length;

    return {
      label: "Tarefas deste mês",
      completed: monthDone,
      total: monthTasks.length,
      percent: monthTasks.length > 0 ? Math.round((monthDone / monthTasks.length) * 100) : 0,
      period: "mês"
    };
  }, [tasks]);

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-normal text-[#131A20]">Progresso</h2>
          <p className="text-xs font-light text-[#456C8D] mt-0.5">{label}</p>
        </div>
        <div className="w-8 h-8 bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[#456C8D]" />
        </div>
      </div>

      {/* Big number */}
      <div className="flex items-end gap-2 mb-4">
        <span className="text-4xl font-light text-[#131A20] tabular-nums leading-none">{percent}%</span>
        <span className="text-xs font-light text-[#456C8D] mb-1">{completed}/{total} concluídas</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#EAEAEA] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${percent}%`,
            background: percent >= 80 ? "#131A20" : percent >= 50 ? "#456C8D" : "#6FA6FF"
          }}
        />
      </div>

      {/* Status label */}
      <p className="text-xs font-light text-[#456C8D]">
        {percent === 100
          ? "✓ Tudo concluído!"
          : percent >= 70
          ? "Quase lá, continue!"
          : percent >= 40
          ? "Bom ritmo, avance!"
          : total === 0
          ? "Sem tarefas agendadas"
          : "Vamos lá, comece agora!"}
      </p>
    </div>
  );
}