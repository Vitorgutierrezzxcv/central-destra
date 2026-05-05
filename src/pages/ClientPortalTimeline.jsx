import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useThemeColor } from "@/hooks/useThemeColor";
import { CheckCircle2, Clock, AlertCircle, Circle, Flag, Target, Zap, Loader2, Calendar } from "lucide-react";
import { format, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const taskStatusConfig = {
  pending:     { icon: Circle,       color: "text-slate-400",   bg: "bg-slate-300",    label: "Pendente",      border: "border-slate-200" },
  in_progress: { icon: Clock,        color: "text-blue-500",    bg: "bg-blue-500",     label: "Em Andamento",  border: "border-blue-200"  },
  completed:   { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500",  label: "Concluído",     border: "border-emerald-200" },
  blocked:     { icon: AlertCircle,  color: "text-rose-500",    bg: "bg-rose-500",     label: "Bloqueado",     border: "border-rose-200"  },
};

const milestoneTypeConfig = {
  kickoff:    { icon: Zap,          color: "bg-blue-100 text-blue-700 border-blue-200",         label: "Kickoff" },
  review:     { icon: Target,       color: "bg-amber-100 text-amber-700 border-amber-200",      label: "Revisão" },
  delivery:   { icon: Flag,         color: "bg-emerald-100 text-emerald-700 border-emerald-200",label: "Entrega" },
  approval:   { icon: CheckCircle2, color: "bg-purple-100 text-purple-700 border-purple-200",   label: "Aprovação" },
  launch:     { icon: Zap,          color: "bg-rose-100 text-rose-700 border-rose-200",         label: "Lançamento" },
  other:      { icon: Target,       color: "bg-slate-100 text-slate-600 border-slate-200",      label: "Marco" },
};

export default function ClientPortalTimeline() {
  useThemeColor("#050D1B");
  const { userLoading, projects, canAccessProject, callPortalData } = useClientPortal();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: milestones = [] } = useQuery({
    queryKey: ["client_milestones", activeProject?.id],
    queryFn: () => callPortalData("get_milestones", { project_id: activeProject.id }).then(d =>
      [...(d?.milestones || [])].sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(a.due_date || 0) - new Date(b.due_date || 0))
    ),
    enabled: !!activeProject?.id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["client_timeline_tasks", activeProject?.id],
    queryFn: () => callPortalData("get_tasks", { project_id: activeProject.id }).then(d =>
      [...(d?.tasks || [])].sort((a, b) => new Date(a.end_date || a.start_date || 0) - new Date(b.end_date || b.start_date || 0))
    ),
    enabled: !!activeProject?.id,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["client_timeline_meetings", activeProject?.id],
    queryFn: () => callPortalData("get_meetings", { project_id: activeProject.id }).then(d => d?.meetings || []),
    enabled: !!activeProject?.id
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
      </div>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === "completed").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const projectProgress = activeProject?.progress_percentage || 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #050D1B 0%, #020408 100%)" }}>
      <div className="max-w-full w-full px-5 md:px-4 pt-10 md:pt-12 pb-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-blue-200/50 font-medium mb-1">Projeto</p>
            <h1 className="text-7xl md:text-6xl leading-[0.95] font-extralight text-white tracking-tight">
              Timeline
            </h1>
          </div>
            {activeProject && (
            <div className="text-right mb-2">
              <span className="text-3xl font-extralight text-white">{projectProgress}</span>
              <span className="text-sm text-blue-100 font-light">%</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full px-5 md:px-4 space-y-10 pb-20 overflow-x-hidden">
        {!activeProject ? (
          <div className="flex flex-col items-center py-20">
            <Target className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 font-light">Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${projectProgress}%`, backgroundColor: "#64748b" }} />
            </div>

            {/* Summary */}
             <div className="flex flex-row items-center justify-between w-full mt-1">
               <span className="text-xs font-light text-slate-300">{completedMilestones}/{milestones.length} marcos</span>
               <span className="text-xs font-light text-slate-300">{completedTasks}/{tasks.length} tarefas</span>
               <span className="text-xs font-light text-slate-300">{projectProgress}% concluído</span>
             </div>

            {/* Visual Progress Phases */}
             <div className="w-full overflow-x-hidden">
               <div className="flex flex-row items-center justify-between w-full relative mb-6 px-2">
                 {/* Background line - slate */}
                 <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-600 -translate-y-1/2 z-0 rounded-full" />

                 {/* Segmented lines */}
                 {[
                   { label: "Kickoff", desc: "Alinhamento inicial", color: "#64748b" },
                   { label: "Planejamento", desc: "Estratégia e roadmap", color: "#64748b" },
                   { label: "Desenvolvimento", desc: "Execução do projeto", color: "#64748b" },
                   { label: "Testes", desc: "QA e validação", color: "#64748b" },
                   { label: "Entrega", desc: "Finalização", color: "#64748b" }
                 ].map((phase, idx) => {
                   const phaseProgress = (projectProgress / 100) * 5;
                   const isCompleted = phaseProgress > idx + 1;
                   const isActive = Math.floor(phaseProgress) === idx;

                   const totalPositions = 5;
                   const segmentWidth = 100 / (totalPositions - 1);
                   const currentPos = (idx / (totalPositions - 1)) * 100;

                   const fillWidth = isCompleted ? 100 : isActive ? ((phaseProgress - idx) * 100) : 0;

                   return (
                     <div key={idx} style={{ 
                       position: 'absolute',
                       left: `${currentPos}%`,
                       width: `${segmentWidth}%`,
                       height: '1px',
                       top: '50%',
                       transform: 'translateY(-50%)',
                       zIndex: 1
                     }}>
                       <div style={{
                         width: `${fillWidth}%`,
                         height: '100%',
                         backgroundColor: "#475569",
                         transition: 'width 0.7s ease'
                       }} />
                     </div>
                   );
                 })}

                 {[
                   { label: "Kickoff", desc: "Alinhamento inicial" },
                   { label: "Planejamento", desc: "Estratégia e roadmap" },
                   { label: "Desenvolvimento", desc: "Execução do projeto" },
                   { label: "Testes", desc: "QA e validação" },
                   { label: "Entrega", desc: "Finalização" }
                 ].map((phase, idx) => {
                   const phaseProgress = (projectProgress / 100) * 5;
                   const isCompleted = phaseProgress > idx;
                   const isActive = Math.floor(phaseProgress) === idx;

                   return (
                     <div key={idx} className="flex flex-col items-center relative z-10 flex-shrink-0">
                       <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs font-medium border border-slate-500 transition-all"
                       style={{
                         backgroundColor: isActive || isCompleted ? "#64748b" : "#1e293b",
                         borderColor: isActive || isCompleted ? "#64748b" : "#475569",
                         color: isActive || isCompleted ? "white" : "#94a3b8"
                       }}>
                         {isCompleted ? "✓" : idx + 1}
                       </div>
                       <div className="mt-2 text-center">
                         <p className="text-[10px] md:text-xs font-medium text-slate-300">{phase.label}</p>
                         <p className="text-[8px] font-light mt-0.5 hidden md:block text-slate-400">{phase.desc}</p>
                       </div>
                     </div>
                     );
                     })}
                     </div>
                     </div>

                     {/* Phase Descriptions */}
                     <div className="mt-12 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                     {[
                     { 
                     label: "Kickoff", 
                     desc: "Alinhamento inicial",
                     explanation: "Reunião de abertura do projeto onde alinhamos objetivos, escopo, equipe responsável e cronograma geral com todas as partes interessadas."
                     },
                     { 
                     label: "Planejamento", 
                     desc: "Estratégia e roadmap",
                     explanation: "Detalhamento completo da estratégia, criação do roadmap visual, definição de milestones, tarefas e alocação de recursos."
                     },
                     { 
                     label: "Desenvolvimento", 
                     desc: "Execução do projeto",
                     explanation: "Fase principal onde ocorrem as atividades conforme o planejado. Acompanhamento do progresso com atualizações semanais."
                     },
                     { 
                     label: "Testes", 
                     desc: "QA e validação",
                     explanation: "Testes de qualidade, validação de funcionalidades, correção de eventuais problemas encontrados antes da entrega final."
                     },
                     { 
                     label: "Entrega", 
                     desc: "Finalização",
                     explanation: "Entrega dos entregáveis finais, documentação completa, treinamento (se aplicável) e suporte inicial pós-launch."
                     }
                     ].map((phase, idx) => (
                     <div 
                     key={idx}
                     className="p-4 rounded-lg border border-slate-700 bg-slate-900/20 hover:bg-slate-900/40 transition-colors"
                     >
                     <div className="flex items-center gap-2 mb-2">
                     <div 
                       className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                       style={{ backgroundColor: "#64748b" }}
                     />
                     <h3 className="text-sm font-medium text-slate-200">{phase.label}</h3>
                     </div>
                     <p className="text-xs text-slate-400 font-light">{phase.explanation}</p>
                     </div>
                     ))}
                     </div>
                     </div>

                     {milestones.length === 0 && tasks.length === 0 && meetings.length === 0 && (
              <div className="flex flex-col items-center py-20">
                <Target className="w-10 h-10 text-slate-600 mb-4" />
                <p className="text-slate-400 font-light">Nenhum dado de timeline ainda.</p>
                <p className="text-xs text-slate-500 font-light mt-2 text-center">A equipe Destra atualizará em breve.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}