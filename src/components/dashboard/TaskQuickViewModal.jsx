import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  X, Calendar, User, Clock, FileText, Loader2, CheckCircle2,
  Trash2, Timer, MessageSquare, Paperclip, ExternalLink,
  CheckCheck, Circle, ArrowRightCircle, Pencil
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TimeTracker from "@/components/tasks/TimeTracker";
import TaskComments from "@/components/tasks/TaskComments";
import TaskFileUpload from "@/components/tasks/TaskFileUpload";
import PomodoroTimer from "@/components/dashboard/PomodoroTimer";
import TaskForm from "@/components/tasks/TaskForm";

const priorityConfig = {
  low:    { label: "Baixa",  bg: "#F0F4F8", color: "#456C8D" },
  medium: { label: "Média",  bg: "#EBF3FF", color: "#6FA6FF" },
  high:   { label: "Alta",   bg: "#FEF0EE", color: "#C0392B" }
};

const statusConfig = {
  pending:     { label: "Pendente",     color: "#456C8D", icon: Circle },
  in_progress: { label: "Em andamento", color: "#D97706", icon: ArrowRightCircle },
  completed:   { label: "Concluída",    color: "#16A34A", icon: CheckCheck }
};

const TABS = [
  { id: "details",   label: "Detalhes",   icon: FileText },
  { id: "edit",      label: "Editar",     icon: Pencil },
  { id: "track",     label: "Rastrear",   icon: Clock },
  { id: "pomodoro",  label: "Pomodoro",   icon: Timer },
  { id: "comments",  label: "Comentários", icon: MessageSquare },
  { id: "files",     label: "Anexos",     icon: Paperclip },
];

export default function TaskQuickViewModal({ task: initialTask, project, onClose, onUpdate, onDelete }) {
  const [task, setTask] = useState(initialTask);
  const [activeTab, setActiveTab] = useState("details");
  const [creatingNotion, setCreatingNotion] = useState(false);
  const [notionUrl, setNotionUrl] = useState(task?.linked_page_id ? "#" : null);
  const [notionError, setNotionError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();

  if (!task) return null;

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.pending;
  const now = startOfDay(new Date());
  const endDateParsed = task.end_date ? parseISO(task.end_date) : null;
  const isOverdue = endDateParsed && isBefore(endDateParsed, now) && task.status !== "completed";

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.update(task.id, data),
    onSuccess: (updated) => {
      setTask(prev => ({ ...prev, ...updated }));
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onUpdate?.();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Task.delete(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onDelete?.();
      onClose();
    }
  });

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ status: newStatus });
  };

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
      if (res.notionUrl) {
        setNotionUrl(res.notionUrl);
        // NÃO abre automaticamente
      }
    } catch (e) {
      setNotionError("Erro ao criar página no Notion.");
    } finally {
      setCreatingNotion(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100 flex-shrink-0">
            <div className="flex-1 pr-4">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: priority.bg, color: priority.color }}>
                  {priority.label}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${status.color}18`, color: status.color }}>
                  {status.label}
                </span>
                {isOverdue && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                    ⚠ Atrasada
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-[#131A20] leading-snug">{task.title}</h2>
              {project && <p className="text-xs text-[#6FA6FF] font-light mt-0.5">{project.name}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Status Actions */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 flex-shrink-0 flex-wrap">
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isActive = task.status === key;
              return (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  disabled={updateMutation.isPending}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                    isActive
                      ? "text-white border-transparent"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                  style={isActive ? { background: cfg.color, borderColor: cfg.color } : {}}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              );
            })}
            <div className="flex-1" />
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Confirmar?</span>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600 transition-all"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-all"
                >
                  Não
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-slate-100 flex-shrink-0 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id
                      ? "border-[#6FA6FF] text-[#6FA6FF]"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5">

            {/* DETALHES */}
            {activeTab === "details" && (
              <div className="space-y-4">
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
                  {task.time_estimate > 0 && (
                    <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3">
                      <Clock className="w-4 h-4 text-[#6FA6FF] flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#456C8D] uppercase tracking-wide font-medium">Estimativa</p>
                        <p className="text-sm font-medium text-[#131A20]">{Math.round(task.time_estimate / 3600)}h</p>
                      </div>
                    </div>
                  )}
                </div>

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

                {/* Notion */}
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
                      {notionUrl !== "#" && (
                        <Button
                          onClick={() => window.open(notionUrl, "_blank")}
                          variant="outline"
                          size="sm"
                          className="w-full text-sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Abrir no Notion
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-[#456C8D] font-light">
                        Crie uma página no Notion para desenvolver essa tarefa com anotações e conteúdo.
                      </p>
                      {notionError && <p className="text-xs text-red-500">{notionError}</p>}
                      <Button
                        onClick={handleCreateNotionPage}
                        disabled={creatingNotion}
                        className="w-full bg-black hover:bg-slate-800 text-white text-sm"
                        size="sm"
                      >
                        {creatingNotion ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>
                        ) : (
                          <><FileText className="w-4 h-4 mr-2" />Criar página no Notion</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RASTREAR */}
            {activeTab === "track" && (
              <TimeTracker task={task} />
            )}

            {/* POMODORO */}
            {activeTab === "pomodoro" && (
              <div className="flex flex-col items-center py-4">
                <PomodoroTimer />
              </div>
            )}

            {/* COMENTÁRIOS */}
            {activeTab === "comments" && (
              <TaskComments taskId={task.id} />
            )}

            {/* ANEXOS */}
            {activeTab === "files" && (
              <TaskFileUpload
                task={task}
                onFilesUpdate={() => {
                  queryClient.invalidateQueries({ queryKey: ["tasks"] });
                  onUpdate?.();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}