import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Download, MessageSquare, Send, CheckCircle2,
  Clock, AlertCircle, Calendar, Paperclip, Loader2, X
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig = {
  pending:     { label: "Pendente",      dot: "bg-slate-300",    badge: "bg-slate-50 text-slate-500 border-slate-200" },
  in_progress: { label: "Em andamento",  dot: "bg-blue-400",     badge: "bg-blue-50 text-blue-600 border-blue-100" },
  completed:   { label: "Concluído",     dot: "bg-emerald-400",  badge: "bg-emerald-50 text-emerald-600 border-emerald-100" },
};

function TaskDrawer({ task, onClose, user }) {
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["client_task_comments", task?.id],
    queryFn: () => base44.entities.ClientComment.filter({ task_id: task.id }),
    enabled: !!task?.id
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_task_comments"] });
      setCommentText("");
    },
  });

  const overdue = task.end_date && isPast(new Date(task.end_date)) && !isToday(new Date(task.end_date)) && task.status !== "completed";
  const cfg = statusConfig[task.status] || statusConfig.pending;

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
        className="relative bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto z-50 shadow-2xl"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-4 pb-2 md:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
                {task.client_status || cfg.label}
              </span>
              {overdue && <span className="text-[10px] text-rose-500 font-medium">Atrasada</span>}
            </div>
            <h2 className="text-base font-medium text-slate-900 leading-snug">
              {task.client_facing_title || task.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          {task.client_facing_description && (
            <p className="text-sm text-slate-500 font-light leading-relaxed">{task.client_facing_description}</p>
          )}

          {/* Dates */}
          {(task.start_date || task.end_date) && (
            <div className="grid grid-cols-2 gap-3">
              {task.start_date && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-medium mb-1.5">Início</p>
                  <p className="text-sm font-medium text-slate-800">
                    {format(new Date(task.start_date), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{format(new Date(task.start_date), "yyyy")}</p>
                </div>
              )}
              {task.end_date && (
                <div className={`rounded-xl p-4 border ${
                  overdue ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"
                }`}>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-medium mb-1.5">Entrega</p>
                  <p className={`text-sm font-medium ${overdue ? "text-red-600" : "text-slate-800"}`}>
                    {format(new Date(task.end_date), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{format(new Date(task.end_date), "yyyy")}</p>
                </div>
              )}
            </div>
          )}

          {/* Completion summary */}
          {task.completion_summary && task.status === "completed" && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-2">Resumo da entrega</p>
              <p className="text-sm text-slate-700 font-light leading-relaxed">{task.completion_summary}</p>
            </div>
          )}

          {/* Attachments */}
          {task.attachment_urls?.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">Arquivos</p>
              <div className="space-y-2">
                {task.attachment_urls.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors group">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-700 flex-1 truncate font-light">
                      {task.attachment_names?.[idx] || `Arquivo ${idx + 1}`}
                    </span>
                    <Download className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">
              Comentários {comments.length > 0 && `(${comments.length})`}
            </p>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-slate-400 font-light text-center py-4">Nenhum comentário ainda</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-slate-700">Você</p>
                      <p className="text-[10px] text-slate-400 font-light">
                        {comment.created_date ? format(new Date(comment.created_date), "dd/MM HH:mm") : ""}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 font-light leading-relaxed">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2.5">
              <Textarea
                placeholder="Adicionar um comentário..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="min-h-[80px] resize-none text-sm border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-slate-400 transition-all"
              />
              <button
                onClick={async () => {
                  if (!commentText.trim()) return;
                  await createCommentMutation.mutateAsync({
                    task_id: task.id,
                    comment: commentText,
                    comment_type: "general"
                  });
                }}
                disabled={!commentText.trim() || createCommentMutation.isPending}
                className="w-full h-10 bg-slate-900 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                {createCommentMutation.isPending ? "Enviando..." : "Enviar comentário"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ClientPortalTasks() {
  const { user, userLoading, projects, canAccessProject } = useClientPortal();
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState("all");

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["client_visible_tasks", activeProject?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: activeProject.id, visible_to_client: true }),
    enabled: !!activeProject?.id
  });

  const mainTasks = tasks.filter(t => !t.parent_task_id);
  const filteredTasks = filter === "all" ? mainTasks : mainTasks.filter(t => t.status === filter);
  const counts = {
    all: mainTasks.length,
    pending: mainTasks.filter(t => t.status === "pending").length,
    in_progress: mainTasks.filter(t => t.status === "in_progress").length,
    completed: mainTasks.filter(t => t.status === "completed").length,
  };

  if (userLoading || !activeProject) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
        {userLoading
          ? <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          : (
            <div className="text-center py-20">
              <Clock className="w-10 h-10 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-light">Nenhum projeto disponível.</p>
            </div>
          )
        }
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-full w-full px-5 md:px-4 pt-28 md:pt-12 pb-20">
        <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-8">
          {activeProject?.name || "Tarefas"}
        </p>
        <div className="flex items-end justify-between gap-4 mb-8">
          <h1 className="text-[3.25rem] leading-[1.1] font-extralight text-slate-900 tracking-tight">
            Tarefas
          </h1>
          <div className="text-right">
            <span className="text-2xl font-extralight text-slate-900">{counts.completed}</span>
            <span className="text-sm text-slate-400 font-light">/{counts.all}</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">concluídas</p>
          </div>
        </div>
      </div>

      <div className="max-w-full w-full px-5 md:px-4 space-y-6 pb-20">
        <div className="w-full bg-slate-100 rounded-full h-1">
          <div
            className="h-1 rounded-full bg-slate-900 transition-all duration-700"
            style={{ width: counts.all > 0 ? `${(counts.completed / counts.all) * 100}%` : '0%' }}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "Todas" },
            { key: "in_progress", label: "Em andamento" },
            { key: "pending", label: "Pendentes" },
            { key: "completed", label: "Concluídas" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span className={`ml-1.5 ${filter === f.key ? "opacity-60" : "text-slate-400"}`}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CheckCircle2 className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 font-light text-sm">Nenhuma tarefa nesta categoria</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(task => {
              const cfg = statusConfig[task.status] || statusConfig.pending;
              const overdue = task.end_date && isPast(new Date(task.end_date)) && !isToday(new Date(task.end_date)) && task.status !== "completed";

              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="w-full text-left bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 leading-snug group-hover:text-slate-700 transition-colors">
                        {task.client_facing_title || task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
                          {task.client_status || cfg.label}
                        </span>
                        {overdue && (
                          <span className="text-[10px] text-rose-500 font-medium">Atrasada</span>
                        )}
                        {task.end_date && (
                          <span className={`text-[10px] flex items-center gap-1 ${overdue ? "text-rose-400" : "text-slate-400"} font-light`}>
                            <Calendar className="w-3 h-3" />
                            {format(new Date(task.end_date), "dd/MM/yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <MessageSquare className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedTask && (
          <TaskDrawer
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
}