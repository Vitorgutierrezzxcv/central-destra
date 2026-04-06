import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Paperclip, X, FileText, Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  open:           { label: "Aberto",            className: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress:    { label: "Em Andamento",      className: "bg-purple-100 text-purple-700 border-purple-200" },
  waiting_client: { label: "Aguardando você",   className: "bg-amber-100 text-amber-700 border-amber-200" },
  resolved:       { label: "Resolvido",         className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed:         { label: "Fechado",           className: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function TicketChat({ ticket, user, onBack }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const bottomRef = useRef();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["ticket_messages", ticket.id],
    queryFn: () => base44.entities.TicketMessage.filter({ ticket_id: ticket.id }),
    refetchInterval: 10000,
    select: d => [...d].sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const urls = [];
      const names = [];
      for (const f of pendingFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        urls.push(file_url);
        names.push(f.name);
      }
      setUploading(false);
      return base44.entities.TicketMessage.create({
        ticket_id: ticket.id,
        sender_email: user.email,
        sender_name: user.full_name || user.name || user.email,
        sender_role: "client",
        content: text.trim(),
        attachment_urls: urls,
        attachment_names: names,
      });
    },
    onSuccess: () => {
      setText("");
      setPendingFiles([]);
      qc.invalidateQueries({ queryKey: ["ticket_messages", ticket.id] });
    }
  });

  const handleSend = () => {
    if (!text.trim() && pendingFiles.length === 0) return;
    sendMutation.mutate();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cfg = statusConfig[ticket.status] || statusConfig.open;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 text-sm truncate">{ticket.title}</h3>
              <Badge className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Aberto em {format(new Date(ticket.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
        {/* First message = ticket description */}
        <div className="flex justify-start">
          <div className="max-w-[80%]">
            <p className="text-xs text-slate-400 mb-1">{ticket.opened_by_name || ticket.opened_by_email} · Descrição inicial</p>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 shadow-sm">
              {ticket.description || ticket.title}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.sender_role === "client";
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%]`}>
                <p className={`text-xs text-slate-400 mb-1 ${isMe ? "text-right" : ""}`}>
                  {isMe ? "Você" : (msg.sender_name || "Equipe Destra")}
                  {" · "}{format(new Date(msg.created_date), "HH:mm", { locale: ptBR })}
                </p>
                <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                }`}>
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  {msg.attachment_urls?.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.attachment_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer"
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                            isMe ? "bg-blue-500 hover:bg-blue-400" : "bg-slate-100 hover:bg-slate-200"
                          } transition-colors`}>
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{msg.attachment_names?.[i] || `Arquivo ${i + 1}`}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {ticket.status !== "closed" && (
        <div className="px-4 py-3 border-t border-slate-100 bg-white space-y-2">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{f.name}</span>
                  <button onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))}>
                    <X className="w-3 h-3 hover:text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Enter para enviar)"
              className="flex-1 min-h-[44px] max-h-32 resize-none text-sm border-slate-200"
              rows={2}
            />
            <input
              type="file" multiple ref={fileRef}
              className="hidden"
              onChange={e => setPendingFiles(p => [...p, ...Array.from(e.target.files)])}
            />
            <div className="flex flex-col gap-1">
              <Button size="icon" variant="outline" className="w-9 h-9 border-slate-200"
                onClick={() => fileRef.current?.click()}>
                <Paperclip className="w-4 h-4 text-slate-500" />
              </Button>
              <Button size="icon" className="w-9 h-9 bg-blue-600 hover:bg-blue-700"
                onClick={handleSend}
                disabled={sendMutation.isPending || uploading || (!text.trim() && pendingFiles.length === 0)}>
                {(sendMutation.isPending || uploading)
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {ticket.status === "closed" && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-xs text-slate-400">Este chamado está fechado.</p>
        </div>
      )}
    </div>
  );
}