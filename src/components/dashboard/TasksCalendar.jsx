import React, { useState } from "react";
import { isSameDay, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function TasksCalendar({ tasks, selectedDate, onDateChange }) {
  const today = new Date();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const getTasksForDate = (date) =>
    tasks.filter((task) => {
      const startDate = task.start_date ? parseISO(task.start_date) : null;
      const endDate = task.end_date ? parseISO(task.end_date) : null;
      if (startDate && isSameDay(startDate, date)) return true;
      if (endDate && isSameDay(endDate, date)) return true;
      return false;
    });

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  const monthName = format(new Date(viewYear, viewMonth, 1), "MMMM yyyy", { locale: ptBR });

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-7 h-7 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-[#456C8D]" />
        </button>
        <span className="text-sm font-normal text-[#131A20] capitalize">{monthName}</span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 rounded-lg hover:bg-[#F7F7F7] flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-4 h-4 text-[#456C8D]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-light text-[#456C8D] py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />;

          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const hasTasks = getTasksForDate(date).length > 0;

          return (
            <button
              key={idx}
              onClick={() => onDateChange(date)}
              className={`
                relative mx-auto w-8 h-8 rounded-xl flex items-center justify-center text-xs font-light transition-all
                ${isSelected ? "bg-[#131A20] text-white" : isToday ? "bg-[#6FA6FF]/15 text-[#131A20] font-normal" : "text-[#131A20] hover:bg-[#F7F7F7]"}
              `}
            >
              {date.getDate()}
              {hasTasks && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#6FA6FF]" />
              )}
              {hasTasks && isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date tasks */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-[#EAEAEA]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-light text-[#456C8D] capitalize">
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
            <span className="text-[11px] font-light text-[#131A20] bg-[#EAEAEA] px-2 py-0.5 rounded-full">
              {selectedTasks.length} tarefa{selectedTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}