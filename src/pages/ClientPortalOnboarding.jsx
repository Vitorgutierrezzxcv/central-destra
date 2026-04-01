import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, Upload, AlertCircle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const responsibleLabels = {
  client: "Você",
  destra: "Equipe Destra",
  both: "Ambos"
};

const statusConfig = {
  pending:     { icon: Circle,      color: "text-slate-500", bg: "border-white/10", label: "Pendente" },
  in_progress: { icon: Clock,       color: "text-blue-400",  bg: "border-blue-500/30", label: "Em Andamento" },
  completed:   { icon: CheckCircle2,color: "text-emerald-400",bg: "border-emerald-500/30", label: "Concluído" },
  blocked:     { icon: AlertCircle, color: "text-rose-400",  bg: "border-rose-500/30", label: "Bloqueado" },
};

export default function ClientPortalOnboarding() {
  const { user, userLoading, projects, canAccessProject } = useClientPortal();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState({});

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["client_onboarding_items", activeProject?.id],
    queryFn: () => base44.entities.OnboardingItem.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => (a.order || 0) - (b.order || 0))
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingItem.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client_onboarding_items"] })
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const clientItems = items.filter(i => i.responsible_side === "client" || i.responsible_side === "both");
  const destraItems = items.filter(i => i.responsible_side === "destra");
  const completedAll = items.filter(i => i.status === "completed").length;
  const progress = items.length > 0 ? Math.round((completedAll / items.length) * 100) : 0;

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const markComplete = (item) => {
    updateMutation.mutate({ id: item.id, data: { status: "completed", completed_at: new Date().toISOString() } });
  };

  const ItemCard = ({ item }) => {
    const cfg = statusConfig[item.status] || statusConfig.pending;
    const Icon = cfg.icon;
    const isClientSide = item.responsible_side === "client" || item.responsible_side === "both";
    const canComplete = isClientSide && item.status !== "completed";
    const isOpen = expanded[item.id];

    return (
      <div className={`bg-[#0D1221] border ${cfg.bg} rounded-2xl transition-all`}>
        <div
          className="flex items-center gap-4 p-5 cursor-pointer"
          onClick={() => toggleExpand(item.id)}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border
            ${item.status === "completed" ? "bg-emerald-500/10 border-emerald-500/40" :
              item.status === "in_progress" ? "bg-blue-500/10 border-blue-500/40" :
              "bg-white/5 border-white/10"}`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <Badge className={`text-xs ${
                item.responsible_side === "client" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                item.responsible_side === "destra" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}>
                {responsibleLabels[item.responsible_side] || item.responsible_side}
              </Badge>
            </div>
            {item.due_date && (
              <p className="text-xs text-slate-500">
                Prazo: {format(new Date(item.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${
              item.status === "completed" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
              item.status === "in_progress" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
              "bg-slate-500/20 text-slate-300 border-slate-500/30"
            }`}>
              {cfg.label}
            </Badge>
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </div>
        </div>

        {isOpen && (
          <div className="px-5 pb-5 pt-0 border-t border-white/5">
            {item.description && (
              <p className="text-sm text-slate-400 mt-4 mb-4">{item.description}</p>
            )}
            {item.notes && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-blue-400 font-medium mb-1">Observações da Destra</p>
                <p className="text-sm text-slate-300">{item.notes}</p>
              </div>
            )}
            {item.completed_at && item.status === "completed" && (
              <p className="text-xs text-emerald-400 mb-3 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Concluído em {format(new Date(item.completed_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
            {canComplete && (
              <Button
                size="sm"
                onClick={() => markComplete(item)}
                disabled={updateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {updateMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <CheckCircle2 className="w-3.5 h-3.5" />}
                Marcar como Concluído
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Checklist de Onboarding</h1>
          <p className="text-slate-400 text-sm mt-1">Itens necessários para iniciar seu projeto com a Destra.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {!activeProject ? (
          <div className="text-center py-20 text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {/* Progress Overview */}
            <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-400">Progresso do Onboarding</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{completedAll} <span className="text-slate-500 font-normal text-base">de {items.length} itens</span></p>
                </div>
                <div className="text-3xl font-bold text-blue-400">{progress}%</div>
              </div>
              <Progress value={progress} className="h-2.5 bg-white/10" />
              {progress === 100 && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm text-emerald-300">Parabéns! Onboarding completo. Seu projeto já pode começar! 🚀</p>
                </div>
              )}
            </div>

            {/* Client Items */}
            {clientItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Sua Responsabilidade
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">{clientItems.length}</Badge>
                </h2>
                {isLoading ? (
                  <p className="text-slate-400 text-sm">Carregando...</p>
                ) : (
                  <div className="space-y-3">
                    {clientItems.map(item => <ItemCard key={item.id} item={item} />)}
                  </div>
                )}
              </div>
            )}

            {/* Destra Items */}
            {destraItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Equipe Destra
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">{destraItems.length}</Badge>
                </h2>
                <div className="space-y-3">
                  {destraItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {items.length === 0 && !isLoading && (
              <div className="text-center py-20 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum item de onboarding definido ainda.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}