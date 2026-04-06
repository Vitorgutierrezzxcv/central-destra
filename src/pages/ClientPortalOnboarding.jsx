import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
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
  pending:     { icon: Circle,       color: "text-slate-400", label: "Pendente" },
  in_progress: { icon: Clock,        color: "text-blue-500",  label: "Em Andamento" },
  completed:   { icon: CheckCircle2, color: "text-emerald-500", label: "Concluído" },
  blocked:     { icon: AlertCircle,  color: "text-rose-500",  label: "Bloqueado" },
};

export default function ClientPortalOnboarding() {
  const { userLoading, projects, canAccessProject } = useClientPortal();
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
      <div className={`bg-white border rounded-2xl transition-all ${item.status === "completed" ? "border-emerald-200" : item.status === "in_progress" ? "border-blue-200" : "border-slate-200"}`}>
        <div
          className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 rounded-2xl transition-colors"
          onClick={() => toggleExpand(item.id)}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border
            ${item.status === "completed" ? "bg-emerald-50 border-emerald-200" :
              item.status === "in_progress" ? "bg-blue-50 border-blue-200" :
              "bg-slate-50 border-slate-200"}`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className={`text-sm font-semibold ${item.status === "completed" ? "text-slate-400 line-through" : "text-slate-900"}`}>{item.title}</p>
              <Badge className={`text-xs ${
                item.responsible_side === "client" ? "bg-blue-100 text-blue-700 border-blue-200" :
                item.responsible_side === "destra" ? "bg-purple-100 text-purple-700 border-purple-200" :
                "bg-amber-100 text-amber-700 border-amber-200"
              }`}>
                {responsibleLabels[item.responsible_side] || item.responsible_side}
              </Badge>
            </div>
            {item.due_date && (
              <p className="text-xs text-slate-400">
                Prazo: {format(new Date(item.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${
              item.status === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
              item.status === "in_progress" ? "bg-blue-100 text-blue-700 border-blue-200" :
              "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              {cfg.label}
            </Badge>
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {isOpen && (
          <div className="px-5 pb-5 pt-0 border-t border-slate-100">
            {item.description && (
              <p className="text-sm text-slate-500 mt-4 mb-4">{item.description}</p>
            )}
            {item.notes && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                <p className="text-xs text-blue-600 font-medium mb-1">Observações da Destra</p>
                <p className="text-sm text-slate-700">{item.notes}</p>
              </div>
            )}
            {item.completed_at && item.status === "completed" && (
              <p className="text-xs text-emerald-600 mb-3 flex items-center gap-1">
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
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-slate-900">Checklist de Onboarding</h1>
          <p className="text-slate-500 text-sm mt-1">Itens necessários para iniciar seu projeto com a Destra.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {!activeProject ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {/* Progress Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-500">Progresso do Onboarding</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">
                    {completedAll} <span className="text-slate-400 font-normal text-base">de {items.length} itens</span>
                  </p>
                </div>
                <div className="text-3xl font-bold text-blue-600">{progress}%</div>
              </div>
              <Progress value={progress} className="h-3" />
              {progress === 100 && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm text-emerald-700">Parabéns! Onboarding completo. Seu projeto já pode começar! 🚀</p>
                </div>
              )}
            </div>

            {isLoading && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}

            {/* Client Items */}
            {clientItems.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Sua Responsabilidade
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">{clientItems.length}</Badge>
                </h2>
                <div className="space-y-3">
                  {clientItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {/* Destra Items */}
            {destraItems.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Equipe Destra
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">{destraItems.length}</Badge>
                </h2>
                <div className="space-y-3">
                  {destraItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {items.length === 0 && !isLoading && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">Nenhum item de onboarding definido ainda.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}