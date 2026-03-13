import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  X,
  Calendar,
  User,
  AlertTriangle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  FileText,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const priorityConfig = {
  low:    { label: "Baixa",  bg: "#F0F4F8", color: "#456C8D" },
  medium: { label: "Média",  bg: "#EBF3FF", color: "#6FA6FF" },
  high:   { label: "Alta",   bg: "#FEF0EE", color: "#C0392B" }
};

const statusConfig = {
  pending:     { label: "Pendente",    color: "#456C8D" },
  in_progress: { label: "Em progresso", color: "#D97706" },
  completed:   { label: "Concluída",   color: "#16A34A" }
};

export default function TaskQuickViewModal({ task, project, onClose }) {
  const [creatingNotion, setCreatingNotion] = useState(false);
  const [notionUrl, setNotionUrl] = useState(null);
  const [notionError, setNotionError] = useState(null);

  if (!task) return null;

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.pending;
  const now = startOfDay(new Date());
  const endDateParsed = task.end_date ? parseISO(task.end_date) : null;
  const isOverdue = endDateParsed && isBefore(endDateParsed, now);

  const handleCreateNotionPage = async () => {
    setCreatingNotion(true);
    setNotionError(null);
    try {
      const res = await base44.functions.invoke("createNotionPage", {
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description || "",
        projectName: project?.name || "",
        priority: priority.label,
        endDate: task.end_date ? format(parseISO(task.end_date), "dd/MM/yyyy", { locale: ptBR }) : ""
      });
      if (res.data.notionUrl) {
        setNotionUrl(res.data.notionUrl);
        window.open(res.data.notionUrl, "_blank");
      }
    } catch (e) {
      setNotionError("Erro ao criar página no Notion.");
    } finally {
      setCreatingNotion(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-slate-100">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: priority.bg, color: priority.color }}
                >
                  {priority.label}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  {status.label}
                </span>
                {isOverdue && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                    ⚠ Atrasada
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-[#131A20] leading-snug">
                {task.title}
              </h2>
              {project && (
                <p className="text-sm text-[#6FA6FF] font-light mt-0.5">{project.name}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3">
              {task.end_date && (
                <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3">
                  <Calendar className="w-4 h-4 text-[#6FA6FF] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#456C8D] uppercase tracking-wide font-medium">Prazo</p>
                    <p className={`text-sm font-medium ${isOverdue ? "text-red-600" : "text-[#131A20]"}`}>
                      {format(parseISO(task.end_date), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
              {task.assigned_to && (
                <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3">
                  <User className="w-4 h-4 text-[#6FA6FF] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#456C8D] uppercase tracking-wide font-medium">Responsável</p>
                    <p className="text-sm font-medium text-[#131A20] truncate">{task.assigned_to.split("@")[0]}</p>
                  </div>
                </div>
              )}
              {task.start_date && (
                <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3">
                  <Clock className="w-4 h-4 text-[#6FA6FF] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#456C8D] uppercase tracking-wide font-medium">Início</p>
                    <p className="text-sm font-medium text-[#131A20]">
                      {format(parseISO(task.start_date), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
              {task.time_estimate && (
                <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3">
                  <Clock className="w-4 h-4 text-[#6FA6FF] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#456C8D] uppercase tracking-wide font-medium">Estimativa</p>
                    <p className="text-sm font-medium text-[#131A20]">
                      {Math.round(task.time_estimate / 3600)}h
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {task.description ? (
              <div>
                <p className="text-xs font-semibold text-[#456C8D] uppercase tracking-wide mb-2">Descrição</p>
                <p className="text-sm text-[#131A20] font-light leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4">
                  {task.description}
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-sm text-[#456C8D] font-light">Sem descrição</p>
              </div>
            )}

            {/* Notion Section */}
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">N</span>
                </div>
                <p className="text-sm font-semibold text-[#131A20]">Notion</p>
              </div>

              {notionUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Página criada com sucesso!
                  </div>
                  <Button
                    onClick={() => window.open(notionUrl, "_blank")}
                    variant="outline"
                    size="sm"
                    className="w-full text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir no Notion
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[#456C8D] font-light">
                    Crie uma página no Notion para desenvolver essa tarefa com anotações, pesquisas e conteúdo.
                  </p>
                  {notionError && (
                    <p className="text-xs text-red-500">{notionError}</p>
                  )}
                  <Button
                    onClick={handleCreateNotionPage}
                    disabled={creatingNotion}
                    className="w-full bg-black hover:bg-slate-800 text-white text-sm"
                    size="sm"
                  >
                    {creatingNotion ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando página...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Criar página no Notion
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}