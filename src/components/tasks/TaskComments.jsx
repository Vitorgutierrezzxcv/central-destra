import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

export default function TaskComments({ taskId }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => base44.entities.TaskComment.filter({ task_id: taskId }, "created_date", 100),
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      base44.entities.TaskComment.create({
        task_id: taskId,
        author_email: currentUser.email,
        author_name: currentUser.full_name || currentUser.email.split("@")[0],
        content: text.trim(),
      }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskComment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addMutation.mutate();
  };

  return (
    <div className="mt-3 border-t border-[#EAEAEA] pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-[#456C8D] hover:text-[#6FA6FF] transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {open ? "Ocultar comentários" : `Comentários${comments.length > 0 ? ` (${comments.length})` : ""}`}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <p className="text-xs text-slate-400">Carregando...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhum comentário ainda. Seja o primeiro!</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 group">
                  <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                    <AvatarFallback className="text-[9px] bg-[#6FA6FF] text-white">
                      {getInitials(c.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-[#131A20]">{c.author_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {c.created_date
                          ? formatDistanceToNow(parseISO(c.created_date), { addSuffix: true, locale: ptBR })
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs text-[#456C8D] leading-relaxed whitespace-pre-wrap break-words">
                      {c.content}
                    </p>
                  </div>
                  {currentUser?.email === c.author_email && (
                    <button
                      onClick={() => deleteMutation.mutate(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 items-end pt-1">
            <Avatar className="w-6 h-6 flex-shrink-0 mb-1">
              <AvatarFallback className="text-[9px] bg-[#131A20] text-white">
                {getInitials(currentUser?.full_name || currentUser?.email)}
              </AvatarFallback>
            </Avatar>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Escreva um comentário... (Enter para enviar)"
              className="flex-1 text-xs min-h-[36px] max-h-32 resize-none border-[#EAEAEA] focus:border-[#6FA6FF] rounded-xl py-2"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!text.trim() || addMutation.isPending}
              className="h-8 w-8 bg-[#6FA6FF] hover:bg-[#5a8fe0] flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}