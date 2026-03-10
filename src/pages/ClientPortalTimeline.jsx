import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Package, ThumbsUp, Video, GitBranch, Flag, MessageSquare, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const eventConfig = {
  task_completed: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Tarefa concluída" },
  delivery_sent: { icon: Package, color: "text-blue-400", bg: "bg-blue-500/10", label: "Entrega enviada" },
  delivery_approved: { icon: ThumbsUp, color: "text-purple-400", bg: "bg-purple-500/10", label: "Entrega aprovada" },
  meeting_held: { icon: Video, color: "text-amber-400", bg: "bg-amber-500/10", label: "Reunião realizada" },
  phase_changed: { icon: GitBranch, color: "text-blue-400", bg: "bg-blue-500/10", label: "Mudança de fase" },
  milestone_reached: { icon: Flag, color: "text-rose-400", bg: "bg-rose-500/10", label: "Marco atingido" },
  comment_added: { icon: MessageSquare, color: "text-slate-400", bg: "bg-slate-500/10", label: "Comentário" },
  file_uploaded: { icon: Upload, color: "text-cyan-400", bg: "bg-cyan-500/10", label: "Arquivo enviado" },
};

export default function ClientPortalTimeline() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["client_projects", user?.company_id],
    queryFn: () => base44.entities.Project.filter({ company_id: user.company_id, client_portal_enabled: true }),
    enabled: !!user?.company_id
  });
  const activeProject = projects.find(p => p.status === "active") || projects[0];

  const { data: events = [] } = useQuery({
    queryKey: ["client_timeline", activeProject?.id],
    queryFn: () => base44.entities.ProjectTimelineEvent.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
  });

  const groupByDate = (events) => {
    const groups = {};
    events.forEach(e => {
      const dateKey = format(new Date(e.event_date), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(e);
    });
    return groups;
  };

  const grouped = groupByDate(events);

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Timeline do Projeto</h1>
          <p className="text-slate-400 text-sm mt-1">Histórico cronológico de eventos do projeto.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {events.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum evento registrado ainda.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5" />
            <div className="space-y-8">
              {Object.entries(grouped).map(([dateKey, dayEvents]) => (
                <div key={dateKey} className="relative pl-16">
                  <div className="sticky top-4 mb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {format(new Date(dateKey), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {dayEvents.map(event => {
                      const cfg = eventConfig[event.event_type] || eventConfig.task_completed;
                      const Icon = cfg.icon;
                      return (
                        <div key={event.id} className="relative">
                          <div className="absolute -left-10 w-8 h-8 rounded-full bg-[#0B0F1A] border border-white/10 flex items-center justify-center">
                            <div className={`w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center`}>
                              <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            </div>
                          </div>
                          <div className="bg-[#0D1221] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-[10px] px-1.5 py-0 ${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>
                              <span className="text-xs text-slate-500 ml-auto">
                                {format(new Date(event.event_date), "HH:mm")}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold text-white">{event.title}</h3>
                            {event.description && <p className="text-xs text-slate-400 mt-1">{event.description}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}