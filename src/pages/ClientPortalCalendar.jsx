import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Video, MapPin, Users, CheckCircle2, Clock, Target, Loader2 } from "lucide-react";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const meetingTypeLabels = {
  kickoff: "Kickoff", weekly: "Weekly", review: "Revisão",
  presentation: "Apresentação", onboarding: "Onboarding", ad_hoc: "Reunião",
};

const milestoneTypeLabels = {
  kickoff: "Kickoff", review: "Revisão", delivery: "Entrega",
  approval: "Aprovação", launch: "Lançamento", other: "Marco",
};

export default function ClientPortalCalendar() {
  const { userLoading, projects, canAccessProject, callPortalData } = useClientPortal();
  const [filter, setFilter] = useState("all");

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: meetings = [] } = useQuery({
    queryKey: ["client_calendar_meetings", activeProject?.id],
    queryFn: () => callPortalData("get_meetings", { project_id: activeProject.id }).then(d => d?.meetings || []),
    enabled: !!activeProject?.id
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["client_calendar_milestones", activeProject?.id],
    queryFn: () => callPortalData("get_milestones", { project_id: activeProject.id }).then(d => d?.milestones || []),
    enabled: !!activeProject?.id
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const now = new Date();

  const events = [
    ...meetings.map(m => ({
      id: m.id, type: "meeting", title: m.title,
      date: m.start_datetime ? parseISO(m.start_datetime) : null,
      dateStr: m.start_datetime, endDateStr: m.end_datetime,
      label: meetingTypeLabels[m.meeting_type] || "Reunião",
      link: m.meeting_link, location: m.location,
      description: m.description, status: m.status, participants: m.participants,
    })),
    ...milestones.map(m => ({
      id: m.id, type: "milestone", title: m.title,
      date: m.due_date ? parseISO(m.due_date) : null,
      dateStr: m.due_date, label: milestoneTypeLabels[m.milestone_type] || "Marco",
      description: m.description, status: m.status,
    })),
  ]
    .filter(e => e.date !== null)
    .sort((a, b) => a.date - b.date);

  const upcoming = events.filter(e => isAfter(e.date, now));
  const past = events.filter(e => isBefore(e.date, now));
  const displayed = filter === "upcoming" ? upcoming : filter === "past" ? past : events;

  const EventCard = ({ event }) => {
    const pastEvent = isBefore(event.date, now);
    const isMeeting = event.type === "meeting";

    return (
      <div className={`bg-white border rounded-2xl p-5 transition-all ${
        pastEvent ? "border-slate-100 opacity-70" :
        isMeeting ? "border-[#001A3D]/20 hover:shadow-sm" : "border-purple-200 hover:shadow-sm"
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center
            ${isMeeting ? "bg-[#001A3D]/10" : "bg-purple-50"}`}>
            <span className={`text-lg font-bold leading-none ${isMeeting ? "text-[#001A3D]" : "text-purple-700"}`}>
              {format(event.date, "dd")}
            </span>
            <span className={`text-[10px] uppercase font-medium ${isMeeting ? "text-[#001A3D]" : "text-purple-500"}`}>
              {format(event.date, "MMM", { locale: ptBR })}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <Badge className={`text-xs ${isMeeting ? "bg-[#001A3D]/10 text-[#001A3D] border-[#001A3D]/20" : "bg-purple-100 text-purple-700 border-purple-200"}`}>
                {isMeeting ? <Video className="w-3 h-3 mr-1" /> : <Target className="w-3 h-3 mr-1" />}
                {event.label}
              </Badge>
              {event.status === "completed" && (
                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />Realizado
                </Badge>
              )}
              {event.status === "cancelled" && (
                <Badge className="text-xs bg-rose-100 text-rose-700 border-rose-200">Cancelado</Badge>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{event.title}</h3>
            {event.description && <p className="text-xs text-slate-500 mt-1">{event.description}</p>}
            <div className="flex flex-wrap gap-3 mt-2">
              {event.dateStr && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {isMeeting ? format(event.date, "HH:mm") : format(event.date, "dd/MM/yyyy")}
                  {event.endDateStr && ` – ${format(parseISO(event.endDateStr), "HH:mm")}`}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="w-3 h-3" />{event.location}
                </span>
              )}
              {event.participants?.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="w-3 h-3" />{event.participants.join(", ")}
                </span>
              )}
            </div>
            {event.link && !pastEvent && (
              <a href={event.link} target="_blank" rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#001A3D] rounded-lg text-xs text-white hover:bg-[#000F20] transition-colors">
                <Video className="w-3 h-3" />
                Entrar na reunião
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-full w-full px-5 md:px-4 pt-28 md:pt-12 pb-0">
         <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-2">
           Calendário
         </p>
        <h1 className="text-6xl md:text-[4rem] leading-[0.85] font-extralight text-slate-900 tracking-tight mb-3">
          Reuniões<br /><span className="text-7xl md:text-[4.5rem]">e Marcos</span>
        </h1>
        <p className="text-xl md:text-[0.9rem] text-slate-400 font-light leading-relaxed mb-2">
          Datas importantes e próximos eventos.
        </p>
      </div>

      <div className="max-w-full w-full px-5 md:px-4 space-y-3 pb-20 pt-3">
        <div className="flex gap-2 flex-wrap">
          {["all", "upcoming", "past"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                filter === f ? "bg-[#001A3D] border-[#001A3D] text-white" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
            >
              {f === "all" ? "Todos" : f === "upcoming" ? "Próximos" : "Passados"}
            </button>
             ))}
            </div>

        {displayed.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Nenhum evento encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </div>
    </div>
  );
}