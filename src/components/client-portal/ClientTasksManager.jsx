/**
 * ClientTasksManager — Gestor cria tarefas para o CLIENTE executar.
 * O cliente verá essas tarefas no portal e pode marcar como concluídas + anexar arquivos.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Edit2, Loader2, CheckCircle2, Clock, AlertCircle,
  Paperclip, ClipboardCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

const priorityConfig = {
  low:    { label: "Baixa",  color: "bg-slate-100 text-slate-500 border-slate-200" },
  medium: { label: "Média",  color: "bg-amber-100 text-amber-700 border-amber-200" },
  high:   { label: "Alta",   color: "bg-rose-100 text-rose-700 border-rose-200" },
};

const statusConfig = {
  pending:     { label: "Pendente",     color: "bg-slate-100 text-slate-600",   icon: Clock },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-700",     icon: Clock },
  completed:   { label: "Concluída",    color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

export default function ClientTasksManager({ projectId, companyId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["admin_client_tasks", projectId],
    queryFn: () => base44.entities.ClientTask.filter({ project_id: projectId }),
    enabled: !!projectId,
    select: d => [...d].sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || new Date(a.created_date) - new Date(b.created_date))
  });

  const openNew = () => {
    setEditing(null);
    setForm({
      title: "", description: "", due_date: "", priority: "medium",
      requires_attachment: false, attachment_instructions: "", order: tasks.length
    });
    setOpen(true);
  };

  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setOpen(true); };

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? base44.entities.ClientTask.update(editing.id, form)
      : base44.entities.ClientTask.create({ ...form, project_id: projectId, company_id: companyId, status: "pending" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_client_tasks", projectId] }); setOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientTask.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_client_tasks", projectId] })
  });

  const resetStatus = (task) => {
    base44.entities.ClientTask.update(task.id, { status: "pending", completed_at: null, completed_by: null, client_notes: null })
      .then(() => qc.invalidateQueries({ queryKey: ["admin_client_tasks", projectId] }));
  };

  const pendingTasks = tasks.filter(t => t.status !== "completed");
  const doneTasks = tasks.filter(t => t.status === "completed");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-slate-700">{tasks.length} tarefa(s) para o cliente</p>
          {doneTasks.length > 0 && (
            <p className="text-xs text-emerald-600">{doneTasks.length} concluída(s) pelo cliente</p>
          )}
        </div>
        <Button size="sm" onClick={openNew} className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Nova Tarefa
        </Button>
      </div>

      {tasks.length === 0 && !isLoading && (
        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
          <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Nenhuma tarefa criada para o cliente.</p>
          <p className="text-xs text-slate-400 mt-0.5">Crie tarefas que o cliente precisará executar e confirmar no portal.</p>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>}

      {tasks.length > 0 && (
        <div className="space-y-4">
          {/* Pendentes */}
          {pendingTasks.length > 0 && (
            <div className="space-y-2">
              {pendingTasks.map(task => {
                const sc = statusConfig[task.status] || statusConfig.pending;
                const pc = priorityConfig[task.priority] || priorityConfig.medium;
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

                return (
                  <div key={task.id} className={`p-3 bg-white border rounded-xl ${isOverdue ? "border-rose-200 bg-rose-50/30" : "border-slate-200"}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-800">{task.title}</p>
                          <Badge className={`text-[10px] ${pc.color}`}>{pc.label}</Badge>
                          {task.requires_attachment && (
                            <Badge className="text-[10px] bg-violet-100 text-violet-700 border-violet-200 flex items-center gap-0.5">
                              <Paperclip className="w-2.5 h-2.5" /> Requer arquivo
                            </Badge>
                          )}
                        </div>
                        {task.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                          {task.due_date && (
                            <span className={`text-[10px] ${isOverdue ? "text-rose-500 font-medium" : "text-slate-400"}`}>
                              Prazo: {format(new Date(task.due_date), "dd/MM/yyyy")}
                              {isOverdue && " · Atrasada"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(task)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(task.id)} className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Concluídas pelo cliente */}
          {doneTasks.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> Concluídas pelo Cliente ({doneTasks.length})
              </p>
              <div className="space-y-2">
                {doneTasks.map(task => (
                  <div key={task.id} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 line-through decoration-emerald-400">{task.title}</p>
                        {task.client_notes && (
                          <p className="text-xs text-slate-600 mt-1 bg-white border border-emerald-100 rounded-lg p-2 italic">
                            "{task.client_notes}"
                          </p>
                        )}
                        {task.client_attachment_urls?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {task.client_attachment_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full hover:underline">
                                <Paperclip className="w-2.5 h-2.5" />
                                {task.client_attachment_names?.[i] || `Arquivo ${i + 1}`}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          {task.completed_at && (
                            <span className="text-[10px] text-emerald-600">
                              Concluída em {format(new Date(task.completed_at), "dd/MM/yyyy HH:mm")}
                            </span>
                          )}
                          <button
                            onClick={() => resetStatus(task)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                          >
                            Reabrir
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(task.id)} className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-violet-600" />
              {editing ? "Editar Tarefa do Cliente" : "Nova Tarefa para o Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl">
              <p className="text-xs text-violet-700">O cliente verá esta tarefa no portal e precisará marcá-la como concluída — podendo também anexar arquivos se necessário.</p>
            </div>

            <div><Label className="text-xs">Título *</Label><Input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Enviar contrato assinado" className="mt-1" /></div>
            <div><Label className="text-xs">Descrição / Instruções</Label><Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="mt-1 resize-none" placeholder="Descreva em detalhes o que o cliente precisa fazer..." /></div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Prazo</Label><Input type="date" value={form.due_date || ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="mt-1" /></div>
              <div><Label className="text-xs">Prioridade</Label>
                <Select value={form.priority || "medium"} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!form.requires_attachment}
                  onCheckedChange={v => setForm(f => ({ ...f, requires_attachment: v }))}
                />
                <Label className="text-xs font-medium">Requer envio de arquivo pelo cliente</Label>
              </div>
              {form.requires_attachment && (
                <div>
                  <Label className="text-xs">Instruções sobre o arquivo</Label>
                  <Input
                    value={form.attachment_instructions || ""}
                    onChange={e => setForm(f => ({ ...f, attachment_instructions: e.target.value }))}
                    placeholder="Ex: Envie o contrato assinado em PDF"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <div><Label className="text-xs">Ordem de exibição</Label><Input type="number" value={form.order ?? 0} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="mt-1 w-24" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
              {saveMutation.isPending ? "Salvando..." : editing ? "Salvar Alterações" : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}