import React, { useState } from "react";
import { X, Download, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TaskApprovalModal({ task, onClose, onSubmit }) {
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        taskId: task.id,
        decision,
        feedback
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Aprovar Tarefa</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Título e resumo */}
          <div>
            <h3 className="text-xl font-light text-slate-900 mb-2">{task.client_facing_title || task.title}</h3>
            {task.client_facing_description && (
              <p className="text-sm text-slate-600 font-light leading-relaxed">{task.client_facing_description}</p>
            )}
            {task.completion_summary && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">Resumo da execução</p>
                <p className="text-sm text-slate-700 font-light">{task.completion_summary}</p>
              </div>
            )}
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            {task.start_date && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Início</p>
                <p className="text-sm font-light text-slate-900">{format(new Date(task.start_date), "dd/MM/yyyy")}</p>
              </div>
            )}
            {task.delivery_date && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Entrega</p>
                <p className="text-sm font-light text-slate-900">{format(new Date(task.delivery_date), "dd/MM/yyyy")}</p>
              </div>
            )}
          </div>

          {/* Arquivos anexados */}
          {task.attachment_urls && task.attachment_urls.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">Documentação</p>
              <div className="space-y-2">
                {task.attachment_urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    <span className="text-sm font-light text-slate-700 flex-1 truncate">
                      {task.attachment_names?.[idx] || `Anexo ${idx + 1}`}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Decisão */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">Sua decisão</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDecision("approved")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors text-sm ${
                  decision === "approved"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                ✓ Aprovar
              </button>
              <button
                onClick={() => setDecision("rejected")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors text-sm ${
                  decision === "rejected"
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                ✕ Rejeitar
              </button>
            </div>
          </div>

          {/* Feedback/Observação */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2 block">
              {decision === "rejected" ? "Motivo da rejeição" : "Observações (opcional)"}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Escreva aqui..."
              className="w-full p-3 border border-slate-200 rounded-lg focus:border-primary focus:outline-none resize-none"
              rows={4}
            />
            <p className="text-[10px] text-slate-400 font-light mt-2">
              {decision === "rejected"
                ? "Suas observações serão enviadas à equipe Destra para análise."
                : "Suas observações serão registradas para conferência da equipe."}
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!decision || isSubmitting}
              className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                decision && !isSubmitting
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}