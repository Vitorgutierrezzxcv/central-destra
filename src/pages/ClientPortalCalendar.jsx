import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Video, MapPin, Users, CheckCircle2, Clock, Target } from "lucide-react";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const meetingTypeLabels = {
  kickoff: "Kickoff",
  weekly: "Weekly",
  review: "Revisão",
  presentation: "Apresentação",
  onboarding: "Onboarding",
  ad_hoc: "Reunião",
};

const milestoneTypeLabels = {
  kickoff: "Kickoff",
  review: "Revisão",
  delivery: "Entrega",
  approval: "Aprovação",
  launch: "Lançamento",
  other: "Marco",
};

export default function ClientPortalCalendar() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["client_projects", user?.company_id],
    queryFn: () => base44.entities.Project.filter({ company_id: user.company_id, client_portal_enabled: true }),
    enabled: !!user?.company_id
  });
  const activeProject = projects.find(p => p.status === "active") || projects[0];

  const { data: meetings = [] } = useQuery({
    queryKey: ["client_calendar_meetings", activeProject?.id],
    queryFn: () => base44.entities.ProjectMeeting.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["client_calendar_milestones", activeProject?.id],
    queryFn: () => base44.entities.ProjectMilestone.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id
  });

  const now = new Date();

  const events = [
    ...meetings.map(m => ({
      id: m.id,
      type: "meeting",
      title: m.title,
      date: m.start_datetime ? parseISO(m.start_datetime) : null,
      dateStr: m.start_datetime,
      endDateStr: m.end_datetime,
      label: meetingTypeLabels[m.meeting_type] || "Reunião",
      link: m.meeting_link,
      location: m.location,
      description: m.description,
      status: m.status,
      participants: m.participants,
    })),
    ...milestones.map(m => ({
      id: m.id,
      type: "milestone",
      title: m.title,
      date: m.due_date ? parseISO(m.due_date) : null,
      dateStr: m.due_date,
      label: milestoneTypeLabels[m.milestone_type] || "Marco",
      description: m.description,
      status: m.status,
    })),
  ]
    .filter(e => e.date !== null)
    .sort((a, b) => a.date - b.date);

  const upcoming = events.filter(e => isAfter(e.date, now));
  const past = events.filter(e => isBefore(e.date, now));
  const displayed = filter === "upcoming" ? upcoming : filter === "past" ? past : events;

  const EventCard = ({ event }) => {
    const isPast = isBefore(event.date, now);
    const isMeeting = event.type === "meeting";

    return (
      <div className={`bg-[#0D1221] border rounded-2xl p-5 transition-all
        ${isPast ? "border-white/5 opacity-60" : isMeeting ? "border-blue-500/20 hover:border-blue-500/30" : "border-purple-500/20 hover:border-purple-500/30"}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center
            ${isMeeting ? "bg-blue-500/10" : "bg-purple-500/10"}`}>
            <span className={`text-lg font-bold leading-none ${isMeeting ? "text-blue-400" : "text-purple-400"}`}>
              {format(event.date, "dd")}
            </span>
            <span className={`text-[10px] uppercase font-medium ${isMeeting ? "text-blue-300" : "text-purple-300"}`}>
              {format(event.date, "MMM", { locale: ptBR })}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <Badge className={`text-xs ${isMeeting ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-purple-500/20 text-purple-300 border-purple-500/30"}`}>
                {isMeeting ? <Video className="w-3 h-3 mr-1" /> : <Target className="w-3 h-3 mr-1" />}
                {event.label}
              </Badge>
              {event.status === "completed" && (
                <Badge className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />Realizado
                </Badge>
              )}
              {event.status === "cancelled" && (
                <Badge className="text-xs bg-rose-500/20 text-rose-300 border-rose-500/30">Cancelado</Badge>
              )}
            </div>
            <h3 className="text-sm font-semibold text-white">{event.title}</h3>
            {event.description && <p className="text-xs text-slate-400 mt-1">{event.description}</p>}
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
            {event.link && !isPast && (
              <a href={event.link} target="_blank" rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-xs text-blue-300 hover:bg-blue-600/30 transition-colors">
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
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Calendário do Projeto</h1>
          <p className="text-slate-400 text-sm mt-1">Reuniões, marcos e datas importantes.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="flex gap-2">
          {["all", "upcoming", "past"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
                ${filter === f ? "bg-blue-600 border-blue-600 text-white" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"}`}
            >
              {f === "all" ? "Todos" : f === "upcoming" ? "Próximos" : "Passados"}
            </button>
          ))}
          <div className="ml-auto flex gap-3 items-center text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Reuniões ({meetings.length})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" />Marcos ({milestones.length})</span>
          </div>
        </div>

        {displayed.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum evento encontrado.</p>
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