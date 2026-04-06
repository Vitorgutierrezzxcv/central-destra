import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, AlertCircle, XCircle, MessageSquare,
  Paperclip, Star, ThumbsUp, ThumbsDown, RefreshCw, Loader2,
  Package, Timer, AlertTriangle, CalendarClock, Flame
} from "lucide-react";
import { format, differenceInDays, parseISO, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

// Calcula prazo de 3 dias a partir do completed_at
function getApprovalDeadline(task) {
  const ref = task.approval_deadline || (task.completed_at ? addDays(parseISO(task.completed_at), 3).toISOString() : null);
  return ref ? parseISO(ref) : null;
}

function ApprovalDeadlineBadge({ task }) {
  const deadline = getApprovalDeadline(task);
  if (!deadline) return null;

  const daysLeft = differenceInDays(deadline, new Date());
  const expired = isPast(deadline);

  if (expired) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
        <AlertTriangle className="w-3 h-3" />
        Prazo expirado
      </span>
    );
  }
  if (daysLeft === 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg animate-pulse">
        <Flame className="w-3 h-3" />
        Prazo encerra hoje!
      </span>
    );
  }
  if (daysLeft === 1) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
        <Timer className="w-3 h-3" />
        Falta 1 dia para aprovar
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
      <CalendarClock className="w-3 h-3" />
      Aprovação até {format(deadline, "dd/MM/yyyy")} · {daysLeft} dias
    </span>
  );
}

function FeedbackModal({ task, delivery, onClose, onSubmit, loading }) {
  const [decision, setDecision] = useState("approved");
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");

  const title = delivery?.title || task?.client_facing_title || task?.title;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Avaliar Entrega</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">{title}</p>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Decisão */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Sua decisão *</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "approved", label: "Aprovar", icon: ThumbsUp, active: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                { value: "changes_requested", label: "Pedir Ajustes", icon: RefreshCw, active: "border-amber-500 bg-amber-50 text-amber-700" },
                { value: "rejected", label: "Reprovar", icon: ThumbsDown, active: "border-rose-500 bg-rose-50 text-rose-700" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDecision(opt.value)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all text-sm font-medium
                    ${decision === opt.value ? opt.active : "border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <opt.icon className="w-5 h-5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nota */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Nota de qualidade (1–5)</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all text-sm font-bold
                    ${score >= n ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-400 hover:border-slate-300"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Comentário */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Comentário (opcional)</p>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Deixe um comentário para a equipe..."
              className="resize-none border-slate-200"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onSubmit({ approval_status: decision, score, comment })}
            disabled={loading}
            className={`text-white ${decision === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : decision === "rejected" ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"}`}
          >
            {loading ? "Enviando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientPortalDeliveries() {
  const { userLoading, contactId, companyId, projects, canAccessProject } = useClientPortal();
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [filter, setFilter] = useState("pending"); // pending | all
  const qc = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  // Busca TODAS as tarefas do projeto — sem filtro visible_to_client
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["client_tasks_deliveries", activeProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => d.filter(t => !t.parent_task_id)
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

  const getTaskDeliveries = (taskId) => deliveries.filter(d => d.task_id === taskId);
  const getTaskFeedback = (taskId) => feedbacks.find(f => f.task_id === taskId && !f.delivery_id);
  const getDeliveryFeedback = (deliveryId) => feedbacks.find(f => f.delivery_id === deliveryId);

  // Tarefa pode ser aprovada: está concluída E não tem feedback ainda
  const canApproveTask = (task) => {
    if (task.status !== "completed") return false;
    const taskDeliveries = getTaskDeliveries(task.id);
    if (taskDeliveries.some(d => ["delivered", "under_review"].includes(d.status))) return false;
    return !getTaskFeedback(task.id);
  };

  // Ordem de prioridade visual:
  // 1. Concluídas aguardando aprovação (sem feedback, prazo ativo)
  // 2. Em andamento
  // 3. Pendentes
  // 4. Já avaliadas
  const getSortPriority = (task) => {
    if (canApproveTask(task)) {
      const deadline = getApprovalDeadline(task);
      if (deadline && isPast(deadline)) return 1; // expiradas ficam logo abaixo das urgentes
      return 0; // urgentes primeiro
    }
    if (task.status === "in_progress") return 2;
    if (task.status === "pending") return 3;
    return 4;
  };

  const sortedTasks = [...tasks].sort((a, b) => getSortPriority(a) - getSortPriority(b));

  const pendingApprovalTasks = sortedTasks.filter(t => canApproveTask(t));
  const displayedTasks = filter === "pending" ? pendingApprovalTasks : sortedTasks;

  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ form, delivery, task }) => {
      const newStatus = form.approval_status === "approved" ? "approved"
        : form.approval_status === "rejected" ? "rejected"
        : "changes_requested";

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

      if (delivery?.id) {
        await base44.entities.TaskDelivery.update(delivery.id, { status: newStatus });
      }

      // Atualiza o approval_status da tarefa
      await base44.entities.Task.update(task.id, {
        approval_status: form.approval_status
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_deliveries_list"] });
      qc.invalidateQueries({ queryKey: ["client_feedbacks"] });
      qc.invalidateQueries({ queryKey: ["client_tasks_deliveries"] });
      setFeedbackTarget(null);
    }
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
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tarefas & Aprovações</h1>
              <p className="text-slate-500 text-sm mt-1">
                {activeProject?.name} · {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}
                {pendingApprovalTasks.length > 0 && (
                  <span className="ml-2 text-rose-600 font-semibold">· {pendingApprovalTasks.length} aguardando sua aprovação</span>
                )}
              </p>
            </div>
            {pendingApprovalTasks.length > 0 && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-semibold text-rose-700">{pendingApprovalTasks.length} pendente{pendingApprovalTasks.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: "pending", label: `Aguardando Aprovação (${pendingApprovalTasks.length})` },
            { key: "all", label: `Todas as Tarefas (${tasks.length})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                filter === f.key
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !activeProject ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">Nenhum projeto disponível.</p>
          </div>
        ) : displayedTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">
              {filter === "pending" ? "Nenhuma tarefa aguardando aprovação." : "Nenhuma tarefa encontrada."}
            </p>
            {filter === "pending" && tasks.length > 0 && (
              <button onClick={() => setFilter("all")} className="mt-3 text-sm text-blue-600 hover:underline">
                Ver todas as tarefas
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedTasks.map(task => {
              const taskDeliveries = getTaskDeliveries(task.id);
              const taskFeedback = getTaskFeedback(task.id);
              const isPendingApproval = canApproveTask(task);
              const deadline = isPendingApproval ? getApprovalDeadline(task) : null;
              const deadlineExpired = deadline && isPast(deadline);
              const daysLeft = deadline ? differenceInDays(deadline, new Date()) : null;
              const isUrgent = isPendingApproval && daysLeft !== null && daysLeft <= 1 && !deadlineExpired;

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl overflow-hidden border transition-all ${
                    isPendingApproval && !deadlineExpired
                      ? isUrgent
                        ? "border-orange-300 shadow-md shadow-orange-100"
                        : "border-amber-300 shadow-sm shadow-amber-50"
                      : task.status === "completed"
                        ? "border-emerald-200"
                        : task.status === "in_progress"
                          ? "border-blue-200"
                          : "border-slate-200"
                  }`}
                >
                  {/* Urgency banner */}
                  {isPendingApproval && !deadlineExpired && (
                    <div className={`px-5 py-2 flex items-center gap-2 ${
                      isUrgent ? "bg-orange-500" : "bg-amber-500"
                    }`}>
                      <AlertCircle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                      <p className="text-xs font-semibold text-white">
                        {daysLeft === 0
                          ? "Prazo encerra HOJE — sua aprovação é necessária agora"
                          : daysLeft === 1
                            ? "Falta apenas 1 dia para o prazo de aprovação"
                            : `Aguarda sua aprovação · Prazo: ${format(deadline, "dd/MM/yyyy")}`}
                      </p>
                    </div>
                  )}

                  {deadlineExpired && isPendingApproval && (
                    <div className="px-5 py-2 flex items-center gap-2 bg-slate-500">
                      <AlertTriangle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                      <p className="text-xs font-semibold text-white">Prazo de aprovação expirado</p>
                    </div>
                  )}

                  {/* Task header */}
                  <div className={`p-5 ${
                    isPendingApproval && !deadlineExpired
                      ? "bg-amber-50/40"
                      : task.status === "completed"
                        ? "bg-emerald-50/30"
                        : task.status === "in_progress"
                          ? "bg-blue-50/30"
                          : ""
                  }`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                          task.status === "completed" ? "bg-emerald-500" :
                          task.status === "in_progress" ? "bg-blue-500" :
                          "bg-slate-300"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-slate-900 text-base leading-tight">
                            {task.client_facing_title || task.title}
                          </h2>
                          {task.client_facing_description && (
                            <p className="text-sm text-slate-500 mt-1">{task.client_facing_description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2">
                            {task.start_date && (
                              <span className="text-xs text-slate-400">
                                Início: {format(new Date(task.start_date), "dd/MM/yyyy")}
                              </span>
                            )}
                            {task.end_date && (
                              <span className="text-xs text-slate-400">
                                Prazo: {format(new Date(task.end_date), "dd/MM/yyyy")}
                              </span>
                            )}
                            {task.completed_at && task.status === "completed" && (
                              <span className="text-xs text-emerald-600">
                                Concluída em {format(parseISO(task.completed_at), "dd/MM/yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge className={`text-xs ${
                          task.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {task.client_status ||
                            (task.status === "completed" ? "Concluído" :
                             task.status === "in_progress" ? "Em andamento" : "Pendente")}
                        </Badge>
                        {isPendingApproval && <ApprovalDeadlineBadge task={task} />}
                      </div>
                    </div>

                    {task.completion_summary && task.status === "completed" && (
                      <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <p className="text-xs text-emerald-700 font-semibold mb-1">O que foi entregue</p>
                        <p className="text-sm text-slate-700">{task.completion_summary}</p>
                      </div>
                    )}
                  </div>

                  {/* Deliveries or approval area */}
                  <div className="px-5 pb-5 space-y-3">
                    {/* TaskDeliveries com aprovação */}
                    {taskDeliveries.map(delivery => {
                      const fb = getDeliveryFeedback(delivery.id);
                      const canApprove = ["delivered", "under_review"].includes(delivery.status) && !fb;

                      return (
                        <div key={delivery.id} className={`border rounded-xl p-4 mt-3 ${
                          canApprove ? "border-amber-200 bg-amber-50/30" : "border-slate-200"
                        }`}>
                          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                            <p className="text-sm font-semibold text-slate-800">{delivery.title}</p>
                            <Badge className={`text-xs ${
                              delivery.status === "approved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                              delivery.status === "rejected" ? "bg-rose-100 text-rose-700 border-rose-200" :
                              delivery.status === "changes_requested" ? "bg-amber-100 text-amber-700 border-amber-200" :
                              "bg-blue-100 text-blue-700 border-blue-200"
                            }`}>
                              {delivery.status === "approved" ? "Aprovado" :
                               delivery.status === "rejected" ? "Reprovado" :
                               delivery.status === "changes_requested" ? "Ajustes solicitados" :
                               "Aguardando revisão"}
                            </Badge>
                          </div>

                          {delivery.description && (
                            <p className="text-sm text-slate-500 mb-3">{delivery.description}</p>
                          )}

                          {delivery.public_notes && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                              <p className="text-xs text-blue-600 font-medium mb-1">Nota da equipe</p>
                              <p className="text-sm text-slate-700">{delivery.public_notes}</p>
                            </div>
                          )}

                          {delivery.attachment_urls?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {delivery.attachment_urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors">
                                  <Paperclip className="w-3 h-3" />
                                  {delivery.attachment_names?.[i] || `Arquivo ${i + 1}`}
                                </a>
                              ))}
                            </div>
                          )}

                          {fb ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              Sua avaliação: {fb.score}/5 ·{" "}
                              {fb.approval_status === "approved" ? "✓ Aprovado" :
                               fb.approval_status === "rejected" ? "✗ Reprovado" :
                               "↺ Ajustes solicitados"}
                            </div>
                          ) : canApprove ? (
                            <Button
                              size="sm"
                              onClick={() => setFeedbackTarget({ delivery, task })}
                              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 mt-2"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Avaliar esta entrega
                            </Button>
                          ) : null}
                        </div>
                      );
                    })}

                    {/* Aprovação direta da tarefa (sem delivery) */}
                    {isPendingApproval && !deadlineExpired && taskDeliveries.length === 0 && (
                      <div className={`border-2 rounded-xl p-4 mt-3 ${
                        isUrgent ? "border-orange-300 bg-orange-50" : "border-amber-300 bg-amber-50"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className={`w-4 h-4 ${isUrgent ? "text-orange-600" : "text-amber-600"}`} />
                          <p className={`text-sm font-semibold ${isUrgent ? "text-orange-800" : "text-amber-800"}`}>
                            Esta entrega aguarda sua aprovação
                          </p>
                        </div>
                        <p className="text-xs text-amber-600 mb-3">
                          A tarefa foi concluída. Revise e aprove ou solicite ajustes.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setFeedbackTarget({ delivery: null, task })}
                          className={`gap-1.5 text-white ${isUrgent ? "bg-orange-600 hover:bg-orange-700" : "bg-amber-600 hover:bg-amber-700"}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Aprovar / Solicitar Ajustes
                        </Button>
                      </div>
                    )}

                    {/* Feedback já enviado */}
                    {taskFeedback && taskDeliveries.length === 0 && (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 mt-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>
                          Avaliado:{" "}
                          {taskFeedback.approval_status === "approved" ? "✓ Aprovado" :
                           taskFeedback.approval_status === "rejected" ? "✗ Reprovado" :
                           "↺ Ajustes solicitados"}
                          {taskFeedback.score ? ` · Nota: ${taskFeedback.score}/5` : ""}
                          {taskFeedback.comment ? ` · "${taskFeedback.comment}"` : ""}
                        </span>
                      </div>
                    )}

                    {/* Tarefa não concluída — apenas informativo */}
                    {task.status !== "completed" && taskDeliveries.length === 0 && !taskFeedback && (
                      <p className="text-xs text-slate-400 text-center py-2 mt-2">
                        {task.status === "in_progress"
                          ? "Tarefa em andamento — a aprovação ficará disponível ao concluir."
                          : "Tarefa ainda não iniciada."}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {feedbackTarget && (
        <FeedbackModal
          task={feedbackTarget.task}
          delivery={feedbackTarget.delivery}
          onClose={() => setFeedbackTarget(null)}
          onSubmit={(form) =>
            submitFeedbackMutation.mutate({ form, delivery: feedbackTarget.delivery, task: feedbackTarget.task })
          }
          loading={submitFeedbackMutation.isPending}
        />
      )}
    </div>
  );
}