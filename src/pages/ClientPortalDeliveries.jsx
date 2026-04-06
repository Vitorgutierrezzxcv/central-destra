import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, AlertCircle, XCircle,
  Paperclip, ThumbsUp, ThumbsDown, RefreshCw, Loader2, Package, X, Star
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import { motion, AnimatePresence } from "framer-motion";

const deliveryStatusConfig = {
  pending_delivery:  { label: "Aguardando Entrega",     badge: "bg-slate-50 text-slate-500 border-slate-200",     icon: Clock },
  delivered:         { label: "Aguarda sua Revisão",    badge: "bg-blue-50 text-blue-600 border-blue-100",        icon: Clock },
  under_review:      { label: "Em Revisão",             badge: "bg-amber-50 text-amber-600 border-amber-100",     icon: Clock },
  approved:          { label: "Aprovado",               badge: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
  changes_requested: { label: "Ajustes Solicitados",    badge: "bg-orange-50 text-orange-600 border-orange-100",  icon: RefreshCw },
  rejected:          { label: "Reprovado",              badge: "bg-rose-50 text-rose-600 border-rose-100",        icon: XCircle },
};

function FeedbackDrawer({ delivery, task, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ approval_status: "approved", score: 4, comment: "" });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="relative bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md z-50 shadow-2xl"
      >
        <div className="flex justify-center pt-4 pb-2 md:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-50">
          <div>
            <h2 className="text-base font-medium text-slate-900">Avaliar Entrega</h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              {delivery?.title || task?.client_facing_title || task?.title}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Decision */}
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">Sua decisão</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "approved", label: "Aprovar", icon: ThumbsUp, active: "bg-emerald-50 border-emerald-300 text-emerald-700" },
                { value: "changes_requested", label: "Ajustes", icon: RefreshCw, active: "bg-amber-50 border-amber-300 text-amber-700" },
                { value: "rejected", label: "Reprovar", icon: ThumbsDown, active: "bg-rose-50 border-rose-300 text-rose-700" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, approval_status: opt.value }))}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all text-xs font-medium
                    ${form.approval_status === opt.value ? opt.active : "border-slate-100 text-slate-400 hover:border-slate-200 bg-slate-50"}`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Score */}
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">Nota (1–5)</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, score: n }))}
                  className={`flex-1 h-10 rounded-xl border-2 transition-all text-sm font-medium flex items-center justify-center
                    ${form.score >= n
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-100 text-slate-300 bg-slate-50 hover:border-slate-200"
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">Comentário (opcional)</p>
            <Textarea
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Deixe um comentário sobre esta entrega..."
              className="resize-none rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSubmit(form)}
              disabled={loading}
              className="flex-1 h-11 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ClientPortalDeliveries() {
  const { userLoading, contactId, companyId, projects, canAccessProject } = useClientPortal();
  const [feedbackTarget, setFeedbackTarget] = useState(null);
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

  const pendingCount = tasks.filter(t => {
    const td = getTaskDeliveries(t.id);
    if (td.length > 0) return td.some(d => ["delivered", "under_review"].includes(d.status));
    return t.approval_required && t.status === "completed" && !getTaskFeedback(t.id);
  }).length;

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-full w-full px-5 md:px-4 pt-28 md:pt-12 pb-20">
         <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-8">
           {activeProject?.name || "Entregas"}
         </p>
        <div className="flex items-end justify-between gap-4 mb-8">
          <h1 className="text-5xl md:text-[3.25rem] leading-[1.1] font-extralight text-slate-900 tracking-tight">
            Entregas
          </h1>
          {pendingCount > 0 && (
            <div className="text-right">
              <span className="text-2xl font-extralight text-slate-900">{pendingCount}</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">pendente{pendingCount > 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-full w-full px-5 md:px-4 space-y-3 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : !activeProject ? (
          <div className="flex flex-col items-center py-20">
            <Package className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 font-light">Nenhum projeto disponível.</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <CheckCircle2 className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 font-light">Nenhuma tarefa disponível no momento.</p>
            <p className="text-slate-400 text-sm font-light mt-2 text-center max-w-xs">
              As tarefas aparecerão aqui quando forem liberadas pela equipe.
            </p>
          </div>
        ) : (
          tasks.map(task => {
            const taskDeliveries = getTaskDeliveries(task.id);
            const taskFeedback = getTaskFeedback(task.id);
            const canApproveTask = task.approval_required && task.status === "completed" && !taskFeedback && taskDeliveries.length === 0;
            const statusDot = task.status === "completed" ? "bg-emerald-400" : task.status === "in_progress" ? "bg-blue-400" : "bg-slate-300";
            const statusBadge = task.status === "completed"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : task.status === "in_progress"
                ? "bg-blue-50 text-blue-600 border-blue-100"
                : "bg-slate-50 text-slate-500 border-slate-200";

            return (
              <div key={task.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {/* Task Header */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusDot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <h2 className="text-sm font-medium text-slate-900 flex-1">
                          {task.client_facing_title || task.title}
                        </h2>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusBadge}`}>
                          {task.client_status || (task.status === "completed" ? "Concluído" : task.status === "in_progress" ? "Em andamento" : "Pendente")}
                        </span>
                      </div>
                      {task.client_facing_description && (
                        <p className="text-xs text-slate-400 font-light mt-1.5 leading-relaxed">{task.client_facing_description}</p>
                      )}
                      <div className="flex gap-4 mt-2 flex-wrap">
                        {task.start_date && <span className="text-[10px] text-slate-400 font-light">Início: {format(new Date(task.start_date), "dd/MM/yyyy")}</span>}
                        {task.end_date && <span className="text-[10px] text-slate-400 font-light">Prazo: {format(new Date(task.end_date), "dd/MM/yyyy")}</span>}
                      </div>
                    </div>
                  </div>

                  {task.completion_summary && task.status === "completed" && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-1.5">Resumo</p>
                      <p className="text-xs text-slate-600 font-light leading-relaxed">{task.completion_summary}</p>
                    </div>
                  )}
                </div>

                {/* Deliveries */}
                {(taskDeliveries.length > 0 || canApproveTask || taskFeedback) && (
                  <div className="border-t border-slate-50 px-5 py-4 space-y-3 bg-slate-50/50">
                    {taskDeliveries.map(delivery => {
                      const cfg = deliveryStatusConfig[delivery.status] || deliveryStatusConfig.pending_delivery;
                      const Icon = cfg.icon;
                      const fb = getDeliveryFeedback(delivery.id);
                      const canApprove = ["delivered", "under_review"].includes(delivery.status) && !fb;

                      return (
                        <div key={delivery.id} className="bg-white rounded-xl border border-slate-100 p-4">
                          <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                            <p className="text-sm font-medium text-slate-800">{delivery.title}</p>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1.5 ${cfg.badge}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </div>

                          {delivery.delivery_date && (
                            <p className="text-[10px] text-slate-400 font-light mb-2">
                              Entregue em {format(new Date(delivery.delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}

                          {delivery.description && (
                            <p className="text-xs text-slate-500 font-light mb-3 leading-relaxed">{delivery.description}</p>
                          )}

                          {delivery.public_notes && (
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3">
                              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Obs. da equipe</p>
                              <p className="text-xs text-slate-600 font-light">{delivery.public_notes}</p>
                            </div>
                          )}

                          {delivery.attachment_urls?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {delivery.attachment_urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-600 hover:bg-slate-100 transition-colors">
                                  <Paperclip className="w-3 h-3" />
                                  {delivery.attachment_names?.[i] || `Arquivo ${i + 1}`}
                                </a>
                              ))}
                            </div>
                          )}

                          {fb ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-light">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              {fb.score}/5 · {fb.approval_status === "approved" ? "Aprovado" : fb.approval_status === "rejected" ? "Reprovado" : "Ajustes solicitados"}
                            </div>
                          ) : canApprove ? (
                            <button
                              onClick={() => setFeedbackTarget({ delivery, task })}
                              className="w-full h-9 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-colors"
                            >
                              Avaliar esta entrega
                            </button>
                          ) : null}
                        </div>
                      );
                    })}

                    {canApproveTask && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-sm font-medium text-slate-800 mb-1">Esta tarefa aguarda sua aprovação</p>
                        <p className="text-xs text-slate-400 font-light mb-3 leading-relaxed">
                          A tarefa foi concluída. Por favor, revise e aprove ou solicite ajustes.
                        </p>
                        <button
                          onClick={() => setFeedbackTarget({ delivery: null, task })}
                          className="h-9 px-4 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-colors"
                        >
                          Aprovar / Solicitar Ajustes
                        </button>
                      </div>
                    )}

                    {taskFeedback && taskDeliveries.length === 0 && (
                      <div className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-400 font-light">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        Avaliado: {taskFeedback.approval_status === "approved" ? "Aprovado" : taskFeedback.approval_status === "rejected" ? "Reprovado" : "Ajustes solicitados"}
                        {taskFeedback.score ? ` · Nota ${taskFeedback.score}/5` : ""}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {feedbackTarget && (
          <FeedbackDrawer
            delivery={feedbackTarget.delivery}
            task={feedbackTarget.task}
            onClose={() => setFeedbackTarget(null)}
            onSubmit={(form) => submitFeedbackMutation.mutate({ form, delivery: feedbackTarget.delivery, task: feedbackTarget.task })}
            loading={submitFeedbackMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}