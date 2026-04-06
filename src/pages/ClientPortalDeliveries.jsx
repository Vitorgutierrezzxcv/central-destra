import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, AlertCircle, XCircle, MessageSquare,
  Paperclip, Star, ThumbsUp, ThumbsDown, RefreshCw, Loader2, Package
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const deliveryStatusConfig = {
  pending_delivery:  { label: "Aguardando Entrega",       color: "bg-slate-100 text-slate-600 border-slate-200",   icon: Clock },
  delivered:         { label: "Aguardando sua Revisão",   color: "bg-blue-100 text-blue-700 border-blue-200",      icon: Clock },
  under_review:      { label: "Em Revisão",               color: "bg-amber-100 text-amber-700 border-amber-200",   icon: Clock },
  approved:          { label: "Aprovado",                 color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  changes_requested: { label: "Ajustes Solicitados",      color: "bg-orange-100 text-orange-700 border-orange-200", icon: RefreshCw },
  rejected:          { label: "Reprovado",                color: "bg-rose-100 text-rose-700 border-rose-200",       icon: XCircle },
};

function FeedbackModal({ delivery, task, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ approval_status: "approved", score: 5, comment: "" });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Avaliar Entrega</DialogTitle>
          <p className="text-sm text-slate-500">{delivery?.title || task?.client_facing_title || task?.title}</p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Sua decisão *</p>
            <div className="flex gap-2">
              {[
                { value: "approved", label: "Aprovar", icon: ThumbsUp, color: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                { value: "changes_requested", label: "Pedir Ajustes", icon: RefreshCw, color: "border-amber-500 bg-amber-50 text-amber-700" },
                { value: "rejected", label: "Reprovar", icon: ThumbsDown, color: "border-rose-500 bg-rose-50 text-rose-700" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, approval_status: opt.value }))}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-sm font-medium
                    ${form.approval_status === opt.value ? opt.color : "border-slate-200 text-slate-400 hover:border-slate-300"}`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Nota (1–5)</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, score: n }))}
                  className={`w-10 h-10 rounded-lg border-2 transition-all text-sm font-bold
                    ${form.score >= n ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-400 hover:border-slate-300"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Comentário (opcional)</p>
            <Textarea
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Deixe um comentário sobre esta entrega..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Enviando..." : "Confirmar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientPortalDeliveries() {
  const { userLoading, contactId, companyId, projects, canAccessProject } = useClientPortal();
  const [feedbackTarget, setFeedbackTarget] = useState(null); // { delivery, task }
  const qc = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["client_tasks_deliveries", activeProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id,
    select: d => [...d].filter(t => !t.parent_task_id)
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ["client_deliveries_list", activeProject?.id],
    queryFn: () => base44.entities.TaskDelivery.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["client_feedbacks", activeProject?.id],
    queryFn: () => base44.entities.DeliveryFeedback.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ form, delivery, task }) => {
      const newStatus = form.approval_status === "approved" ? "approved"
        : form.approval_status === "rejected" ? "rejected"
        : "changes_requested";

      // Salva o feedback
      await base44.entities.DeliveryFeedback.create({
        delivery_id: delivery?.id || null,
        task_id: task.id,
        project_id: activeProject.id,
        company_id: companyId,
        client_contact_id: contactId,
        approval_status: form.approval_status,
        score: form.score,
        comment: form.comment,
        submitted_at: new Date().toISOString(),
      });

      // Atualiza status da entrega (se existir) ou da tarefa
      if (delivery?.id) {
        await base44.entities.TaskDelivery.update(delivery.id, { status: newStatus });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_deliveries_list"] });
      qc.invalidateQueries({ queryKey: ["client_feedbacks"] });
      setFeedbackTarget(null);
    }
  });

  const getTaskDeliveries = (taskId) => deliveries.filter(d => d.task_id === taskId);
  const getTaskFeedback = (taskId) => feedbacks.find(f => f.task_id === taskId);
  const getDeliveryFeedback = (deliveryId) => feedbacks.find(f => f.delivery_id === deliveryId);

  const pendingApprovals = tasks.filter(t => {
    const taskDeliveries = getTaskDeliveries(t.id);
    if (taskDeliveries.length > 0) {
      return taskDeliveries.some(d => ["delivered", "under_review"].includes(d.status));
    }
    return t.approval_required && t.status === "completed" && !getTaskFeedback(t.id);
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Portal do Cliente</p>
            <h1 className="text-2xl font-bold text-slate-900">Tarefas & Entregas</h1>
            <p className="text-slate-500 text-sm mt-1">Acompanhe o andamento e aprove as entregas do seu projeto.</p>
          </div>
          {pendingApprovals.length > 0 && (
            <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-sm px-3 py-1.5">
              {pendingApprovals.length} pendente{pendingApprovals.length > 1 ? "s" : ""} de aprovação
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !activeProject ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">Nenhum projeto disponível.</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">Nenhuma tarefa disponível no momento.</p>
            <p className="text-slate-400 text-sm mt-1">As tarefas aparecerão aqui quando forem liberadas pela equipe.</p>
          </div>
        ) : (
          tasks.map(task => {
            const taskDeliveries = getTaskDeliveries(task.id);
            const taskFeedback = getTaskFeedback(task.id);
            const canApproveTask = task.approval_required && task.status === "completed" && !taskFeedback && taskDeliveries.length === 0;

            return (
              <div key={task.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {/* Task header */}
                <div className={`p-5 border-b border-slate-100 ${task.status === "completed" ? "bg-emerald-50/50" : task.status === "in_progress" ? "bg-blue-50/50" : ""}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${task.status === "completed" ? "bg-emerald-500" : task.status === "in_progress" ? "bg-blue-500" : "bg-slate-300"}`} />
                      <div>
                        <h2 className="font-semibold text-slate-900 text-base">{task.client_facing_title || task.title}</h2>
                        {task.client_facing_description && (
                          <p className="text-sm text-slate-500 mt-0.5">{task.client_facing_description}</p>
                        )}
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {task.start_date && <span className="text-xs text-slate-400">Início: {format(new Date(task.start_date), "dd/MM/yyyy")}</span>}
                          {task.end_date && <span className="text-xs text-slate-400">Prazo: {format(new Date(task.end_date), "dd/MM/yyyy")}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge className={`text-xs flex-shrink-0 ${task.status === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : task.status === "in_progress" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {task.client_status || (task.status === "completed" ? "Concluído" : task.status === "in_progress" ? "Em andamento" : "Pendente")}
                    </Badge>
                  </div>

                  {task.completion_summary && task.status === "completed" && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-xs text-emerald-600 font-medium mb-1">Resumo da Conclusão</p>
                      <p className="text-sm text-slate-600">{task.completion_summary}</p>
                    </div>
                  )}
                </div>

                {/* Deliveries */}
                <div className="p-4 space-y-3">
                  {taskDeliveries.map(delivery => {
                    const cfg = deliveryStatusConfig[delivery.status] || deliveryStatusConfig.pending_delivery;
                    const Icon = cfg.icon;
                    const fb = getDeliveryFeedback(delivery.id);
                    const canApprove = ["delivered", "under_review"].includes(delivery.status) && !fb;

                    return (
                      <div key={delivery.id} className="border border-slate-200 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{delivery.title}</p>
                            {delivery.delivery_date && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                Entregue em {format(new Date(delivery.delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                          <Badge className={`${cfg.color} flex items-center gap-1.5 text-xs`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                        </div>

                        {delivery.description && (
                          <p className="text-sm text-slate-500 mb-3">{delivery.description}</p>
                        )}

                        {delivery.public_notes && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                            <p className="text-xs text-blue-600 font-medium mb-1">Observações da equipe</p>
                            <p className="text-sm text-slate-700">{delivery.public_notes}</p>
                          </div>
                        )}

                        {delivery.attachment_urls?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {delivery.attachment_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors">
                                <Paperclip className="w-3 h-3" />
                                {delivery.attachment_names?.[i] || `Arquivo ${i + 1}`}
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          {fb ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              Sua avaliação: {fb.score}/5 · {fb.approval_status === "approved" ? "✓ Aprovado" : fb.approval_status === "rejected" ? "✗ Reprovado" : "↺ Ajustes solicitados"}
                            </div>
                          ) : canApprove ? (
                            <Button
                              size="sm"
                              onClick={() => setFeedbackTarget({ delivery, task })}
                              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Avaliar esta entrega
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {/* Tarefa com approval_required mas sem delivery */}
                  {canApproveTask && (
                    <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-amber-800 mb-1">Esta tarefa aguarda sua aprovação</p>
                      <p className="text-xs text-amber-600 mb-3">A tarefa foi concluída. Por favor, revise e aprove ou solicite ajustes.</p>
                      <Button
                        size="sm"
                        onClick={() => setFeedbackTarget({ delivery: null, task })}
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Aprovar / Solicitar Ajustes
                      </Button>
                    </div>
                  )}

                  {taskFeedback && taskDeliveries.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Avaliado: {taskFeedback.approval_status === "approved" ? "Aprovado" : taskFeedback.approval_status === "rejected" ? "Reprovado" : "Ajustes solicitados"}
                      {taskFeedback.score ? ` · Nota: ${taskFeedback.score}/5` : ""}
                    </div>
                  )}

                  {taskDeliveries.length === 0 && !canApproveTask && !taskFeedback && (
                    <p className="text-xs text-slate-400 text-center py-2">Nenhuma entrega registrada para esta tarefa ainda.</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {feedbackTarget && (
        <FeedbackModal
          delivery={feedbackTarget.delivery}
          task={feedbackTarget.task}
          onClose={() => setFeedbackTarget(null)}
          onSubmit={(form) => submitFeedbackMutation.mutate({ form, delivery: feedbackTarget.delivery, task: feedbackTarget.task })}
          loading={submitFeedbackMutation.isPending}
        />
      )}
    </div>
  );
}