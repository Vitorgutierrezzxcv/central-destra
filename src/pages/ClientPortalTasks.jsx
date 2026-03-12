import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Download, MessageSquare, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  pending: { label: "Pendente", icon: Clock, color: "bg-amber-100 text-amber-700" },
  in_progress: { label: "Em Andamento", icon: Clock, color: "bg-blue-100 text-blue-700" },
  completed: { label: "Concluído", icon: CheckCircle2, color: "bg-green-100 text-green-700" }
};

export default function ClientPortalTasks() {
  const { user, userLoading, company, projects, canAccessProject } = useClientPortal();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");

  const activeProject = projects.find(p => p.id === selectedProjectId && canAccessProject(p.id)) || projects[0];

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["client_visible_tasks", activeProject?.id],
    queryFn: () => 
      activeProject?.id 
        ? base44.entities.Task.filter({ 
            project_id: activeProject.id, 
            visible_to_client: true,
            parent_task_id: "" // Apenas tarefas principais
          })
        : [],
    enabled: !!activeProject?.id
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["client_task_comments", selectedTask?.id],
    queryFn: () =>
      selectedTask?.id
        ? base44.entities.ClientComment.filter({ task_id: selectedTask.id })
        : [],
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
      client_contact_id: user.id,
      comment: commentText,
      comment_type: "general"
    });
  };

  const handleDownloadAttachment = (url, name) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name || "arquivo";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl("ClientPortalDashboard")} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Tarefas & Progresso</h1>
            <p className="text-slate-400 text-sm">Acompanhe o status das tarefas do projeto</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task List */}
          <div className="lg:col-span-1">
            <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-4 sticky top-24">
              <h2 className="font-semibold text-white mb-4">Tarefas ({tasks.length})</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tasksLoading ? (
                  <p className="text-slate-400 text-sm">Carregando...</p>
                ) : tasks.length === 0 ? (
                  <p className="text-slate-400 text-sm">Nenhuma tarefa disponível</p>
                ) : (
                  tasks.map(task => {
                    const config = statusConfig[task.status];
                    const Icon = config.icon;
                    return (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedTask?.id === task.id
                            ? "bg-blue-500/20 border-blue-500/30"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color.split(" ")[1]}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {task.client_facing_title || task.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{config.label}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Task Details */}
          <div className="lg:col-span-2">
            {selectedTask ? (
              <div className="space-y-4">
                {/* Task Header */}
                <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {selectedTask.client_facing_title || selectedTask.title}
                      </h2>
                      {selectedTask.client_facing_description && (
                        <p className="text-slate-400 text-sm mb-4">{selectedTask.client_facing_description}</p>
                      )}
                    </div>
                    <Badge className={`${statusConfig[selectedTask.status].color} border-0 text-xs`}>
                      {statusConfig[selectedTask.status].label}
                    </Badge>
                  </div>

                  {/* Status Timeline */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg mb-4">
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">Status Atual</p>
                      <p className="text-white font-medium">{selectedTask.client_status || statusConfig[selectedTask.status].label}</p>
                    </div>
                    {selectedTask.end_date && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Entrega Prevista</p>
                        <p className="text-white font-medium">
                          {format(new Date(selectedTask.end_date), "dd MMM yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Completion Summary */}
                  {selectedTask.completion_summary && selectedTask.status === "completed" && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                      <p className="text-xs text-green-300 font-medium mb-1">Resumo da Entrega</p>
                      <p className="text-sm text-green-100">{selectedTask.completion_summary}</p>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {selectedTask.attachment_urls && selectedTask.attachment_urls.length > 0 && (
                  <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Download className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-white">Arquivos Anexados</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedTask.attachment_urls.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleDownloadAttachment(url, selectedTask.attachment_names?.[idx] || `arquivo-${idx}`)}
                          className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-sm text-white group-hover:text-blue-400 transition-colors">
                            {selectedTask.attachment_names?.[idx] || `Arquivo ${idx + 1}`}
                          </span>
                          <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Comentários</h3>
                    {comments.length > 0 && (
                      <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs ml-auto">
                        {comments.length}
                      </Badge>
                    )}
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-slate-400 text-sm">Nenhum comentário ainda</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-white">{comment.client_contact_id || "Cliente"}</p>
                            <p className="text-xs text-slate-400">
                              {format(new Date(comment.created_at), "dd MMM HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <p className="text-sm text-slate-300">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="space-y-3 border-t border-white/10 pt-4">
                    <Textarea
                      placeholder="Adicionar um comentário público..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="bg-white/5 border border-white/10 text-white placeholder:text-slate-500 min-h-24 resize-none"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || createCommentMutation.isPending}
                      className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Enviar Comentário
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Selecione uma tarefa para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}