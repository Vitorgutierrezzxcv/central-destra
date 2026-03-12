
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { isSameDay, parseISO } from "date-fns";

export default function TasksCalendar({ tasks, selectedDate, onDateChange }) {
  const getTasksForDate = (date) => {
    return tasks.filter((task) => {
      const startDate = task.start_date ? parseISO(task.start_date) : null;
      const endDate = task.end_date ? parseISO(task.end_date) : null;

      if (startDate && isSameDay(startDate, date)) return true;
      if (endDate && isSameDay(endDate, date)) return true;
      return false;
    });
  };

  const modifiers = {
    hasTask: (date) => getTasksForDate(date).length > 0
  };

  const modifiersStyles = {
    hasTask: {
      fontWeight: 'bold',
      position: 'relative'
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateChange}
        locale={ptBR}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-xl md:rounded-2xl border border-slate-200 text-sm md:text-base" />

      
      <div className="mt-3 md:mt-4 w-full">
        <div className="flex items-center gap-1.5 md:gap-2 mb-2">
          <div className="bg-slate-800 rounded-full w-2.5 h-2.5 md:w-3 md:h-3 from-purple-500 to-pink-500" />
          <span className="text-xs md:text-sm text-slate-600">Dias com tarefas</span>
        </div>
        {selectedDate &&
        <div className="mt-2 md:mt-3 p-2.5 md:p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl md:rounded-2xl border border-purple-200">
            <p className="text-xs md:text-sm font-semibold text-slate-900 mb-1.5 md:mb-2 line-clamp-2">
              {selectedDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            </p>
            <div className="flex gap-2">
              <Badge className="bg-white text-slate-400 px-2.5 py-0.5 text-xs font-semibold rounded-full inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow hover:bg-primary/80">
                {getTasksForDate(selectedDate).length} tarefa(s)
              </Badge>
            </div>
          </div>
        }
      </div>
    </div>);

}