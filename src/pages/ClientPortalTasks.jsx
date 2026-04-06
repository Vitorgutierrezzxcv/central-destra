import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Download, MessageSquare, Send, CheckCircle2,
  Clock, AlertCircle, Calendar, Paperclip, ChevronRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  pending:     { label: "Pendente",      icon: Clock,         color: "bg-amber-500/20 text-amber-300 border-amber-500/30",   dot: "bg-amber-400" },
  in_progress: { label: "Em Andamento",  icon: AlertCircle,   color: "bg-blue-500/20 text-blue-300 border-blue-500/30",     dot: "bg-blue-400" },
  completed:   { label: "Concluído",     icon: CheckCircle2,  color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
};

function TaskDateBadge({ date, label }) {
  if (!date) return null;
  const d = new Date(date);
  const overdue = isPast(d) && !isToday(d);
  return (
    <div className={`flex items-center gap-1.5 text-xs ${overdue ? "text-rose-400" : "text-slate-400"}`}>
      <Calendar className="w-3 h-3 flex-shrink-0" />
      <span>{label}: {format(d, "dd/MM/yyyy", { locale: ptBR })}</span>
      {overdue && <span className="text-rose-400 font-medium">(atrasada)</span>}
    </div>
  );
}

export default function ClientPortalTasks() {
  const { user, userLoading, company, projects, canAccessProject } = useClientPortal();
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p => p.id === selectedProjectId && canAccessProject(p.id)) || projects[0];

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["client_visible_tasks", activeProject?.id],
    queryFn: () =>
      base44.entities.Task.filter({
        project_id: activeProject.id,
        visible_to_client: true
      }),
    enabled: !!activeProject?.id
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["client_task_comments", selectedTask?.id],
    queryFn: () =>
      base44.entities.ClientComment.filter({ task_id: selectedTask.id }),
    enabled: !!selectedTask?.id
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_task_comments"] });
      setCommentText("");
    },
  });

  const handleAddComment = async () => {
    if (!commentText.trim() || !user || !selectedTask) return;
    await createCommentMutation.mutateAsync({
      task_id: selectedTask.id,
      project_id: activeProject.id,
      company_id: company?.id,
      client_contact_id: user.linked_client_contact_id || user.id,
      comment: commentText,
      comment_type: "general"
    });
  };

  // Filtra tarefas (apenas principais — sem parent)
  const mainTasks = tasks.filter(t => !t.parent_task_id);
  const filteredTasks = filter === "all" ? mainTasks
    : mainTasks.filter(t => t.status === filter);

  const countByStatus = {
    all: mainTasks.length,
    pending: mainTasks.filter(t => t.status === "pending").length,
    in_progress: mainTasks.filter(t => t.status === "in_progress").length,
    completed: mainTasks.filter(t => t.status === "completed").length,
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Nenhum projeto disponível.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl("ClientPortalProject")} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">Tarefas & Progresso</h1>
            <p className="text-slate-400 text-xs truncate">{activeProject.name}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-bold">{countByStatus.completed}</span> concluídas
            <span className="text-slate-600">/</span>
            <span>{countByStatus.all}</span> total
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Lista de tarefas ── */}
          <div className="lg:col-span-2">
            {/* Filtros */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { key: "all", label: "Todas" },
                { key: "in_progress", label: "Em andamento" },
                { key: "pending", label: "Pendentes" },
                { key: "completed", label: "Concluídas" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    filter === f.key
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"
                  }`}
                >
                  {f.label} {countByStatus[f.key] > 0 && <span className="opacity-70">({countByStatus[f.key]})</span>}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {tasksLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12 border border-white/5 rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Nenhuma tarefa nesta categoria</p>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const cfg = statusConfig[task.status] || statusConfig.pending;
                  const isSelected = selectedTask?.id === task.id;
                  const hasDate = task.start_date || task.end_date;
                  const overdue = task.end_date && isPast(new Date(task.end_date)) && task.status !== "completed";

                  return (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-blue-600/15 border-blue-500/40"
                          : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white leading-snug truncate">
                            {task.client_facing_title || task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge className={`${cfg.color} text-[10px] px-1.5 py-0 border`}>
                              {task.client_status || cfg.label}
                            </Badge>
                            {overdue && (
                              <span className="text-[10px] text-rose-400 font-medium">Atrasada</span>
                            )}
                          </div>
                          {hasDate && (
                            <div className="mt-2 space-y-0.5">
                              <TaskDateBadge date={task.start_date} label="Início" />
                              <TaskDateBadge date={task.end_date} label="Entrega" />
                            </div>
                          )}
                        </div>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${isSelected ? "text-blue-400" : "text-slate-600"}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Detalhes da tarefa ── */}
          <div className="lg:col-span-3">
            {selectedTask ? (
              <div className="space-y-4 sticky top-24">
                {/* Info da tarefa */}
                <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className="text-lg font-bold text-white leading-snug">
                      {selectedTask.client_facing_title || selectedTask.title}
                    </h2>
                    <Badge className={`${(statusConfig[selectedTask.status] || statusConfig.pending).color} border text-xs flex-shrink-0`}>
                      {selectedTask.client_status || (statusConfig[selectedTask.status] || statusConfig.pending).label}
                    </Badge>
                  </div>

                  {selectedTask.client_facing_description && (
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">{selectedTask.client_facing_description}</p>
                  )}

                  {/* Datas */}
                  {(selectedTask.start_date || selectedTask.end_date) && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {selectedTask.start_date && (
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Início</p>
                          <p className="text-sm font-semibold text-white">
                            {format(new Date(selectedTask.start_date), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(selectedTask.start_date), "yyyy")}
                          </p>
                        </div>
                      )}
                      {selectedTask.end_date && (
                        <div className={`rounded-xl p-3 ${isPast(new Date(selectedTask.end_date)) && selectedTask.status !== "completed" ? "bg-rose-500/10 border border-rose-500/20" : "bg-white/5"}`}>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Entrega Prevista</p>
                          <p className={`text-sm font-semibold ${isPast(new Date(selectedTask.end_date)) && selectedTask.status !== "completed" ? "text-rose-300" : "text-white"}`}>
                            {format(new Date(selectedTask.end_date), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(selectedTask.end_date), "yyyy")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resumo de conclusão */}
                  {selectedTask.completion_summary && selectedTask.status === "completed" && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <p className="text-xs text-emerald-400 font-semibold mb-1.5">✓ Resumo da Entrega</p>
                      <p className="text-sm text-emerald-100">{selectedTask.completion_summary}</p>
                    </div>
                  )}
                </div>

                {/* Arquivos */}
                {selectedTask.attachment_urls && selectedTask.attachment_urls.length > 0 && (
                  <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Paperclip className="w-4 h-4 text-blue-400" />
                      <h3 className="font-semibold text-white text-sm">Arquivos Anexados</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedTask.attachment_urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-sm text-white group-hover:text-blue-300 transition-colors truncate">
                            {selectedTask.attachment_names?.[idx] || `Arquivo ${idx + 1}`}
                          </span>
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comentários */}
                <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-white text-sm">Comentários</h3>
                    {comments.length > 0 && (
                      <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs ml-auto">{comments.length}</Badge>
                    )}
                  </div>

                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">Nenhum comentário ainda</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-slate-300">Cliente</p>
                            <p className="text-[10px] text-slate-500">
                              {comment.created_at ? format(new Date(comment.created_at), "dd/MM HH:mm") : ""}
                            </p>
                          </div>
                          <p className="text-sm text-slate-200">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <Textarea
                      placeholder="Adicionar um comentário..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="bg-white/5 border border-white/10 text-white placeholder:text-slate-500 min-h-20 resize-none text-sm"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || createCommentMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm"
                    >
                      <Send className="w-4 h-4" />
                      {createCommentMutation.isPending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-16 text-center">
                <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 text-sm">Selecione uma tarefa para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}