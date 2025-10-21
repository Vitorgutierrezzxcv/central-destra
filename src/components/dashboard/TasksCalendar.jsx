
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { isSameDay, parseISO } from "date-fns";

export default function TasksCalendar({ tasks, selectedDate, onDateChange }) {
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const startDate = task.start_date ? parseISO(task.start_date) : null;
      const endDate = task.end_date ? parseISO(task.end_date) : null;
      
      if (startDate && isSameDay(startDate, date)) return true;
      if (endDate && isSameDay(endDate, date)) return true;
      return false;
    });
  };

  const modifiers = {
    hasTask: (date) => getTasksForDate(date).length > 0,
  };

  const modifiersStyles = {
    hasTask: {
      fontWeight: 'bold',
      position: 'relative',
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
        className="rounded-2xl border border-slate-200"
      />
      
      <div className="mt-4 w-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
          <span className="text-sm text-slate-600">Dias com tarefas</span>
        </div>
        {selectedDate && (
          <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
            <p className="text-sm font-semibold text-slate-900 mb-2">
              {selectedDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <div className="flex gap-2">
              <Badge className="bg-white text-purple-700 rounded-full text-xs">
                {getTasksForDate(selectedDate).length} tarefa(s)
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
