import React from "react";
import { useClientPortal } from "@/components/client-portal/ClientPortalContext";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Building2, TrendingUp, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

const statusLabel = { active: "Em andamento", completed: "Concluído", archived: "Arquivado" };
const statusColor = { active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", completed: "bg-blue-500/20 text-blue-300 border-blue-500/30", archived: "bg-slate-500/20 text-slate-400 border-slate-500/30" };

export default function ClientPortalProjectSelect() {
  const { projects, company, setSelectedProject, isLoading, user } = useClientPortal();
  const navigate = useNavigate();

  const handleSelect = (project) => {
    setSelectedProject(project.id);
    navigate(createPageUrl("ClientPortalDashboard"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Portal do Cliente</p>
              <p className="text-sm font-semibold text-white">{company?.name || "Destra"}</p>
            </div>
          </div>
          <button
            onClick={() => base44.auth.logout()}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Olá, {user?.full_name?.split(" ")[0] || "Cliente"} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Selecione o projeto que você deseja acompanhar.</p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-10 text-center">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Nenhum projeto disponível no momento.</p>
            <p className="text-slate-600 text-xs mt-1">Entre em contato com a equipe Destra.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => handleSelect(project)}
                className="text-left bg-[#0D1221] border border-white/5 hover:border-blue-500/40 rounded-2xl p-6 transition-all group hover:shadow-xl hover:shadow-blue-600/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusColor[project.status] || statusColor.active}`}>
                    {statusLabel[project.status] || "Em andamento"}
                  </span>
                </div>

                <h3 className="font-semibold text-white text-base mb-1 group-hover:text-blue-300 transition-colors">{project.name}</h3>
                {project.service_type && <p className="text-xs text-slate-500 mb-3">{project.service_type}</p>}

                {project.current_phase && (
                  <p className="text-xs text-slate-400 mb-3">Fase: <span className="text-blue-400">{project.current_phase}</span></p>
                )}

                <Progress value={project.progress_percentage || 0} className="h-1.5 bg-white/5 mb-2" />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{project.progress_percentage || 0}% concluído</span>
                  {project.estimated_end_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(project.estimated_end_date), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-1 text-xs text-blue-400 group-hover:gap-2 transition-all">
                  <span>Acessar projeto</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}