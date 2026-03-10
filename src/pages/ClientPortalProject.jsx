import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Building2, Calendar, User, Target, ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const phaseColors = {
  upcoming: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  delayed: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

export default function ClientPortalProject() {
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

  const { data: milestones = [] } = useQuery({
    queryKey: ["client_milestones", activeProject?.id],
    queryFn: () => base44.entities.ProjectMilestone.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => (a.order || 0) - (b.order || 0))
  });

  const { data: company } = useQuery({
    queryKey: ["client_company_detail", user?.company_id],
    queryFn: () => base44.entities.Company.filter({ id: user.company_id }),
    enabled: !!user?.company_id,
    select: d => d?.[0]
  });

  if (!activeProject) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="text-center text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum projeto ativo encontrado.</p>
        </div>
      </div>
    );
  }

  const milestoneStatusIcon = (status) => {
    if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === "in_progress") return <Clock className="w-4 h-4 text-blue-400" />;
    if (status === "delayed") return <AlertCircle className="w-4 h-4 text-rose-400" />;
    return <div className="w-4 h-4 rounded-full border-2 border-slate-600" />;
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Visão do Projeto</p>
          <h1 className="text-2xl font-bold text-white">{activeProject.name}</h1>
          {activeProject.current_phase && (
            <Badge className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/30">{activeProject.current_phase}</Badge>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: Calendar, label: "Início",
              value: activeProject.project_start_date ? format(new Date(activeProject.project_start_date), "dd/MM/yyyy") : "—",
              color: "text-blue-400", bg: "bg-blue-400/10"
            },
            {
              icon: Target, label: "Previsão de Entrega",
              value: activeProject.estimated_end_date ? format(new Date(activeProject.estimated_end_date), "dd/MM/yyyy") : "—",
              color: "text-purple-400", bg: "bg-purple-400/10"
            },
            {
              icon: User, label: "Responsável Destra",
              value: activeProject.project_owner_internal || "A definir",
              color: "text-emerald-400", bg: "bg-emerald-400/10"
            },
          ].map((item, i) => (
            <div key={i} className="bg-[#0D1221] border border-white/5 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <p className="text-xs text-slate-400 mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Description & Scope */}
        {activeProject.description && (
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-3">Sobre o Projeto</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{activeProject.description}</p>
          </div>
        )}

        {/* Progress */}
        <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Progresso Geral</h2>
            <span className="text-2xl font-bold text-blue-400">{activeProject.progress_percentage || 0}%</span>
          </div>
          <Progress value={activeProject.progress_percentage || 0} className="h-3 bg-white/10" />
        </div>

        {/* Roadmap / Milestones */}
        {milestones.length > 0 && (
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-6">Roadmap do Projeto</h2>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />
              <div className="space-y-6">
                {milestones.map((m, i) => (
                  <div key={m.id} className="relative flex items-start gap-4 pl-12">
                    <div className="absolute left-3.5 -translate-x-1/2 w-4 h-4 flex items-center justify-center bg-[#0D1221]">
                      {milestoneStatusIcon(m.status)}
                    </div>
                    <div className="flex-1 bg-white/3 rounded-xl border border-white/5 p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                        <Badge className={`text-xs ${phaseColors[m.status] || phaseColors.upcoming}`}>
                          {m.status === "completed" ? "Concluído" : m.status === "in_progress" ? "Em andamento" : m.status === "delayed" ? "Atrasado" : "Previsto"}
                        </Badge>
                      </div>
                      {m.description && <p className="text-xs text-slate-400 mt-1">{m.description}</p>}
                      {m.due_date && (
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {m.completed_date
                            ? `Concluído em ${format(new Date(m.completed_date), "dd/MM/yyyy")}`
                            : `Previsto para ${format(new Date(m.due_date), "dd 'de' MMMM", { locale: ptBR })}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other Projects */}
        {projects.length > 1 && (
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Outros Projetos</h2>
            <div className="space-y-3">
              {projects.filter(p => p.id !== activeProject.id).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.status === "completed" ? "Concluído" : p.status === "archived" ? "Arquivado" : "Ativo"}</p>
                  </div>
                  <Progress value={p.progress_percentage || 0} className="h-1.5 bg-white/10 flex-1 max-w-24 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}