import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGoogleCalendarEvents } from "@/functions/getGoogleCalendarEvents";
import { ChevronLeft, ChevronRight, Video, MapPin } from "lucide-react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GoogleCalendarWidget() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data, isLoading } = useQuery({
    queryKey: ["googleCalendarEvents", currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: () => getGoogleCalendarEvents({}).then(r => r.data?.events || []),
    staleTime: 5 * 60 * 1000,
  });

  const events = data || [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart); // 0 = Sunday

  const getEventsForDay = (day) =>
    events.filter(e => {
      const dateStr = e.start?.dateTime || e.start?.date;
      if (!dateStr) return false;
      return isSameDay(parseISO(dateStr), day);
    });

  const selectedEvents = getEventsForDay(selectedDate);

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-normal text-[#131A20]">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F7F7F7] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#456C8D]" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F7F7F7] transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[#456C8D]" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-light text-[#456C8D] py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="h-36 flex items-center justify-center text-xs text-[#456C8D] font-light">Carregando...</div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs font-light transition-all
                  ${isSelected ? "bg-[#131A20] text-white" : isToday ? "bg-[#EBF3FF] text-[#6FA6FF]" : "hover:bg-[#F7F7F7] text-[#131A20]"}`}
              >
                {format(day, "d")}
                {dayEvents.length > 0 && (
                  <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? "bg-[#6FA6FF]" : "bg-[#6FA6FF]"}`} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected day events */}
      {selectedEvents.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-[#EAEAEA] pt-4">
          <p className="text-xs font-light text-[#456C8D] mb-2">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </p>
          {selectedEvents.map(ev => {
            const startTime = ev.start?.dateTime ? format(parseISO(ev.start.dateTime), "HH:mm") : null;
            const endTime = ev.end?.dateTime ? format(parseISO(ev.end.dateTime), "HH:mm") : null;
            return (
              <div key={ev.id} className="flex items-start gap-3 p-3 bg-[#F7F7F7] rounded-xl">
                <div className="w-1 h-full min-h-[36px] rounded-full bg-[#6FA6FF] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-normal text-[#131A20] truncate">{ev.summary}</p>
                  {startTime && (
                    <p className="text-[10px] font-light text-[#456C8D] mt-0.5">{startTime}{endTime ? ` – ${endTime}` : ""}</p>
                  )}
                  {ev.location && (
                    <p className="text-[10px] font-light text-[#456C8D] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {ev.location}
                    </p>
                  )}
                </div>
                {ev.hangoutLink && (
                  <a href={ev.hangoutLink} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[#EBF3FF] hover:bg-[#6FA6FF]/20 transition-colors">
                    <Video className="w-3.5 h-3.5 text-[#6FA6FF]" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
      {selectedEvents.length === 0 && !isLoading && (
        <div className="mt-4 border-t border-[#EAEAEA] pt-4">
          <p className="text-xs font-light text-[#456C8D]">Nenhum evento em {format(selectedDate, "dd/MM")}</p>
        </div>
      )}
    </div>
  );
}