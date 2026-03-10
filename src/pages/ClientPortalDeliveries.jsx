import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertCircle, XCircle, MessageSquare, Paperclip, Star, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const statusConfig = {
  pending_delivery: { label: "Aguardando Entrega", color: "bg-slate-500/20 text-slate-300 border-slate-500/30", icon: Clock },
  delivered: { label: "Entregue – Aguardando Revisão", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: Clock },
  under_review: { label: "Em Revisão", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: Clock },
  approved: { label: "Aprovado", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  changes_requested: { label: "Ajustes Solicitados", color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: RefreshCw },
  rejected: { label: "Reprovado", color: "bg-rose-500/20 text-rose-300 border-rose-500/30", icon: XCircle },
};

function DeliveryCard({ delivery, onFeedback, user, existingFeedback }) {
  const cfg = statusConfig[delivery.status] || statusConfig.pending_delivery;
  const Icon = cfg.icon;
  const canApprove = ["delivered", "under_review"].includes(delivery.status);

  return (
    <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">{delivery.title}</h3>
          {delivery.delivery_date && (
            <p className="text-xs text-slate-400 mt-1">
              Entregue em {format(new Date(delivery.delivery_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
        <Badge className={`${cfg.color} flex items-center gap-1.5 text-xs`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </Badge>
      </div>

      {delivery.description && (
        <p className="text-sm text-slate-400 mb-4 leading-relaxed">{delivery.description}</p>
      )}

      {delivery.public_notes && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mb-4">
          <p className="text-xs text-blue-400 font-medium mb-1">Observações da Destra</p>
          <p className="text-sm text-slate-300">{delivery.public_notes}</p>
        </div>
      )}

      <div className="flex items-center flex-wrap gap-3">
        {delivery.attachment_urls?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {delivery.attachment_urls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10 transition-colors"
              >
                <Paperclip className="w-3 h-3" />
                {delivery.attachment_names?.[i] || `Arquivo ${i + 1}`}
              </a>
            ))}
          </div>
        )}

        {existingFeedback ? (
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            Avaliado: {existingFeedback.score}/5
          </div>
        ) : canApprove && (
          <Button
            size="sm"
            onClick={() => onFeedback(delivery)}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Avaliar Entrega
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ClientPortalDeliveries() {
  const [user, setUser] = useState(null);
  const [feedbackDelivery, setFeedbackDelivery] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ approval_status: "approved", score: 5, comment: "" });
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["client_projects", user?.company_id],
    queryFn: () => base44.entities.Project.filter({ company_id: user.company_id, client_portal_enabled: true }),
    enabled: !!user?.company_id
  });
  const activeProject = projects.find(p => p.status === "active") || projects[0];

  const { data: tasks = [] } = useQuery({
    queryKey: ["client_tasks_deliveries", activeProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id
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
    mutationFn: async (data) => {
      const fb = await base44.entities.DeliveryFeedback.create({
        ...data,
        created_at: new Date().toISOString(),
        project_id: activeProject.id,
        company_id: user.company_id,
      });
      await base44.entities.TaskDelivery.update(feedbackDelivery.id, {
        status: data.approval_status === "approved" ? "approved"
          : data.approval_status === "rejected" ? "rejected"
          : "changes_requested"
      });
      return fb;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_deliveries_list"] });
      qc.invalidateQueries({ queryKey: ["client_feedbacks"] });
      setFeedbackDelivery(null);
    }
  });

  const tasksWithDeliveries = tasks.map(t => ({
    ...t,
    deliveries: deliveries.filter(d => d.task_id === t.id)
  }));

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Tarefas & Entregas</h1>
          <p className="text-slate-400 text-sm mt-1">Acompanhe o andamento e aprove as entregas do seu projeto.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {tasksWithDeliveries.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma tarefa disponível no momento.</p>
          </div>
        ) : (
          tasksWithDeliveries.map(task => (
            <div key={task.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${task.status === "completed" ? "bg-emerald-400" : task.status === "in_progress" ? "bg-blue-400" : "bg-slate-500"}`} />
                <h2 className="font-semibold text-white">{task.client_facing_title || task.title}</h2>
                <Badge className={`text-xs ml-auto ${task.status === "completed" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"}`}>
                  {task.client_status || (task.status === "completed" ? "Concluído" : task.status === "in_progress" ? "Em andamento" : "Pendente")}
                </Badge>
              </div>

              {task.client_facing_description && (
                <p className="text-sm text-slate-400 pl-5">{task.client_facing_description}</p>
              )}

              {task.completion_summary && task.status === "completed" && (
                <div className="ml-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-xs text-emerald-400 font-medium mb-1">Resumo da Conclusão</p>
                  <p className="text-sm text-slate-300">{task.completion_summary}</p>
                </div>
              )}

              {task.deliveries.length > 0 && (
                <div className="ml-5 space-y-3">
                  {task.deliveries.map(d => (
                    <DeliveryCard
                      key={d.id}
                      delivery={d}
                      onFeedback={(del) => { setFeedbackDelivery(del); setFeedbackForm({ approval_status: "approved", score: 5, comment: "" }); }}
                      user={user}
                      existingFeedback={feedbacks.find(f => f.delivery_id === d.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Feedback Dialog */}
      <Dialog open={!!feedbackDelivery} onOpenChange={() => setFeedbackDelivery(null)}>
        <DialogContent className="bg-[#0D1221] border border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Avaliar Entrega</DialogTitle>
            <p className="text-sm text-slate-400">{feedbackDelivery?.title}</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Decisão</p>
              <div className="flex gap-2">
                {[
                  { value: "approved", label: "Aprovar", icon: ThumbsUp, color: "border-emerald-500 bg-emerald-500/10 text-emerald-300" },
                  { value: "changes_requested", label: "Pedir Ajustes", icon: RefreshCw, color: "border-amber-500 bg-amber-500/10 text-amber-300" },
                  { value: "rejected", label: "Reprovar", icon: ThumbsDown, color: "border-rose-500 bg-rose-500/10 text-rose-300" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFeedbackForm(f => ({ ...f, approval_status: opt.value }))}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-sm font-medium
                      ${feedbackForm.approval_status === opt.value ? opt.color : "border-white/10 text-slate-400 hover:border-white/20"}`}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Nota (1–5)</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setFeedbackForm(f => ({ ...f, score: n }))}
                    className={`w-10 h-10 rounded-lg border transition-all text-sm font-bold
                      ${feedbackForm.score >= n ? "border-amber-500 bg-amber-500/20 text-amber-300" : "border-white/10 text-slate-500 hover:border-white/20"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Comentário</p>
              <Textarea
                value={feedbackForm.comment}
                onChange={e => setFeedbackForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Deixe um comentário sobre a entrega..."
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFeedbackDelivery(null)} className="text-slate-400 hover:text-white">Cancelar</Button>
            <Button
              onClick={() => submitFeedbackMutation.mutate({ ...feedbackForm, delivery_id: feedbackDelivery?.id, task_id: feedbackDelivery?.task_id })}
              disabled={submitFeedbackMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitFeedbackMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}