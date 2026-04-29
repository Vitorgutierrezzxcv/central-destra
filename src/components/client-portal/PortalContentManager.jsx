/**
 * PortalContentManager — painel admin para gerenciar o conteúdo que o cliente vê:
 * projeto, tarefas, reuniões, marcos (timeline), onboarding, arquivos.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Flag, ClipboardList, File, Plus, Trash2, Edit2, CheckCircle2,
  Clock, Upload, Loader2, Package, FolderOpen, Star, GraduationCap, RefreshCw, ClipboardCheck
} from "lucide-react";
import CoursesManager from "./CoursesManager";
import ClientTasksManager from "./ClientTasksManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

// ─── Projeto (edição completa) ────────────────────────────────────────────────
function ProjectEditor({ project }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...project });
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.Project.update(project.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_all_projects"] });
      qc.invalidateQueries({ queryKey: ["client_all_projects_pool"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  });

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target?.value ?? e }));

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Edite as informações que o cliente verá na aba Projetos do portal.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs">Nome do Projeto</Label>
          <Input value={form.name || ""} onChange={f("name")} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Resumo do que foi contratado</Label>
          <Textarea value={form.description || ""} onChange={f("description")} rows={3} className="mt-1 resize-none" placeholder="Descreva o escopo contratado para o cliente..." />
        </div>
        <div>
          <Label className="text-xs">Status do Projeto</Label>
          <Select value={form.status || "active"} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Em andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Fase Atual</Label>
          <Input value={form.current_phase || ""} onChange={f("current_phase")} className="mt-1" placeholder="Ex: Criação de conteúdo" />
        </div>
        <div>
          <Label className="text-xs">Data de Início</Label>
          <Input type="date" value={form.project_start_date || ""} onChange={f("project_start_date")} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Previsão de Entrega</Label>
          <Input type="date" value={form.estimated_end_date || ""} onChange={f("estimated_end_date")} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Tipo de Serviço</Label>
          <Input value={form.service_type || ""} onChange={f("service_type")} className="mt-1" placeholder="Ex: Gestão de tráfego" />
        </div>
        <div>
          <Label className="text-xs">Responsável Interno</Label>
          <Input value={form.project_owner_internal || ""} onChange={f("project_owner_internal")} className="mt-1" placeholder="Email do responsável" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Progresso (%)</Label>
          <div className="flex items-center gap-3 mt-1">
            <Input
              type="number"
              min={0}
              max={100}
              value={form.progress_percentage ?? 0}
              onChange={e => setForm(p => ({ ...p, progress_percentage: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
              className="w-24"
            />
            <div className="flex-1">
              <Progress value={form.progress_percentage || 0} className="h-3" />
            </div>
            <span className="text-sm font-semibold text-slate-700">{form.progress_percentage || 0}%</span>
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-2 pt-1">
          <Switch
            checked={!!form.client_portal_enabled}
            onCheckedChange={v => setForm(p => ({ ...p, client_portal_enabled: v }))}
          />
          <Label className="text-xs">Portal ativo para o cliente</Label>
        </div>
      </div>
      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className={`w-full ${saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
      >
        {saveMutation.isPending ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Alterações do Projeto"}
      </Button>
    </div>
  );
}

// ─── Reuniões ────────────────────────────────────────────────────────────────
function MeetingsManager({ projectId, companyId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["admin_meetings", projectId],
    queryFn: () => base44.entities.ProjectMeeting.filter({ project_id: projectId }),
    enabled: !!projectId,
    select: d => [...d].sort((a, b) => new Date(a.start_datetime || 0) - new Date(b.start_datetime || 0))
  });

  const openNew = () => {
    setEditing(null);
    setForm({
      title: "", meeting_type: "weekly", start_datetime: "", end_datetime: "",
      meeting_link: "", location: "", description: "", status: "scheduled",
      visible_to_client: true, is_recurring: false,
      recurrence_frequency: "weekly", recurrence_weekday: "",
      recurrence_time: "", recurrence_end_date: ""
    });
    setOpen(true);
  };

  const openEdit = (m) => { setEditing(m); setForm({ ...m }); setOpen(true); };

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? base44.entities.ProjectMeeting.update(editing.id, form)
      : base44.entities.ProjectMeeting.create({ ...form, project_id: projectId, company_id: companyId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_meetings", projectId] }); setOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectMeeting.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_meetings", projectId] })
  });

  const meetingTypeLabels = {
    kickoff: "Kickoff", weekly: "Semanal", review: "Revisão",
    presentation: "Apresentação", onboarding: "Onboarding",
    mentoring: "Mentoria", ad_hoc: "Avulso"
  };
  const statusColors = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-500"
  };
  const freqLabels = { daily: "Diária", weekly: "Semanal", biweekly: "Quinzenal", monthly: "Mensal" };
  const weekdayLabels = { "0": "Dom", "1": "Seg", "2": "Ter", "3": "Qua", "4": "Qui", "5": "Sex", "6": "Sáb" };

  const recurringMeetings = meetings.filter(m => m.is_recurring);
  const singleMeetings = meetings.filter(m => !m.is_recurring);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-700">{meetings.length} reunião(ões)</p>
        <Button size="sm" onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Nova Reunião
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div> :
        meetings.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">Nenhuma reunião. Cadastre reuniões para aparecerem no calendário e timeline do cliente.</p> :
        <div className="space-y-4">
          {/* Recorrentes */}
          {recurringMeetings.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Recorrentes ({recurringMeetings.length})
              </p>
              <div className="space-y-2">
                {recurringMeetings.map(m => (
                  <div key={m.id} className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                        <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5" />
                          {freqLabels[m.recurrence_frequency] || m.recurrence_frequency}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {meetingTypeLabels[m.meeting_type] || m.meeting_type}
                        {m.recurrence_weekday !== undefined && m.recurrence_weekday !== "" && ` · ${weekdayLabels[m.recurrence_weekday]}`}
                        {m.recurrence_time && ` · ${m.recurrence_time}`}
                        {m.recurrence_end_date && ` · até ${format(new Date(m.recurrence_end_date), "dd/MM/yyyy")}`}
                        {m.meeting_link && <span className="ml-1 text-blue-500">· Com link</span>}
                      </p>
                    </div>
                    <Badge className={`text-[10px] flex-shrink-0 ${m.visible_to_client ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                      {m.visible_to_client ? "Visível" : "Oculta"}
                    </Badge>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(m)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(m.id)} className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pontuais */}
          {singleMeetings.length > 0 && (
            <div>
              {recurringMeetings.length > 0 && (
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Pontuais ({singleMeetings.length})
                </p>
              )}
              <div className="space-y-2">
                {singleMeetings.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                      <p className="text-xs text-slate-400">
                        {m.start_datetime ? format(new Date(m.start_datetime), "dd/MM/yyyy HH:mm") : "—"}
                        {" · "}{meetingTypeLabels[m.meeting_type] || m.meeting_type}
                        {m.meeting_link && <span className="ml-2 text-blue-500">· Com link</span>}
                      </p>
                    </div>
                    <Badge className={`text-[10px] ${statusColors[m.status] || "bg-slate-100 text-slate-500"}`}>
                      {m.status === "scheduled" ? "Agendada" : m.status === "completed" ? "Realizada" : "Cancelada"}
                    </Badge>
                    <Badge className={`text-[10px] ${m.visible_to_client ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                      {m.visible_to_client ? "Visível" : "Oculta"}
                    </Badge>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(m)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(m.id)} className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Reunião" : "Nova Reunião"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Tipo: pontual ou recorrente */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_recurring: false }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${!form.is_recurring ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}
              >
                <Calendar className="w-4 h-4" /> Pontual
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_recurring: true }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.is_recurring ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}
              >
                <RefreshCw className="w-4 h-4" /> Recorrente
              </button>
            </div>

            <div><Label className="text-xs">Título *</Label><Input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Tipo de Reunião</Label>
                <Select value={form.meeting_type || "weekly"} onValueChange={v => setForm(f => ({ ...f, meeting_type: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(meetingTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status || "scheduled"} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                    <SelectItem value="completed">Realizada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campos: Pontual */}
            {!form.is_recurring && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Data/Hora Início</Label><Input type="datetime-local" value={form.start_datetime ? form.start_datetime.slice(0, 16) : ""} onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))} className="mt-1" /></div>
                <div><Label className="text-xs">Data/Hora Fim</Label><Input type="datetime-local" value={form.end_datetime ? form.end_datetime.slice(0, 16) : ""} onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))} className="mt-1" /></div>
              </div>
            )}

            {/* Campos: Recorrente */}
            {form.is_recurring && (
              <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Configuração de Recorrência</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Frequência</Label>
                    <Select value={form.recurrence_frequency || "weekly"} onValueChange={v => setForm(f => ({ ...f, recurrence_frequency: v }))}>
                      <SelectTrigger className="mt-1 text-xs bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Horário</Label>
                    <Input type="time" value={form.recurrence_time || ""} onChange={e => setForm(f => ({ ...f, recurrence_time: e.target.value }))} className="mt-1 bg-white" />
                  </div>
                </div>
                {(form.recurrence_frequency === "weekly" || form.recurrence_frequency === "biweekly") && (
                  <div>
                    <Label className="text-xs">Dia da Semana</Label>
                    <Select value={String(form.recurrence_weekday ?? "")} onValueChange={v => setForm(f => ({ ...f, recurrence_weekday: v }))}>
                      <SelectTrigger className="mt-1 text-xs bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(weekdayLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label className="text-xs">Data de Término (opcional)</Label>
                  <Input type="date" value={form.recurrence_end_date || ""} onChange={e => setForm(f => ({ ...f, recurrence_end_date: e.target.value }))} className="mt-1 bg-white" />
                </div>
              </div>
            )}

            <div><Label className="text-xs">Link da Reunião (Google Meet, Zoom...)</Label><Input value={form.meeting_link || ""} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://meet.google.com/..." className="mt-1" /></div>
            <div><Label className="text-xs">Local / Endereço (opcional)</Label><Input value={form.location || ""} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs">Descrição</Label><Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 resize-none" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.visible_to_client} onCheckedChange={v => setForm(f => ({ ...f, visible_to_client: v }))} />
              <Label className="text-xs">Visível ao cliente</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Marcos / Timeline ───────────────────────────────────────────────────────
function MilestonesManager({ projectId, companyId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ["admin_milestones", projectId],
    queryFn: () => base44.entities.ProjectMilestone.filter({ project_id: projectId }),
    enabled: !!projectId,
    select: d => [...d].sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(a.due_date || 0) - new Date(b.due_date || 0))
  });

  const openNew = () => { setEditing(null); setForm({ title: "", milestone_type: "other", due_date: "", status: "upcoming", description: "", visible_to_client: true, order: milestones.length }); setOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...m }); setOpen(true); };

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? base44.entities.ProjectMilestone.update(editing.id, form)
      : base44.entities.ProjectMilestone.create({ ...form, project_id: projectId, company_id: companyId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_milestones", projectId] }); setOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectMilestone.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_milestones", projectId] })
  });

  const statusColors = { upcoming: "bg-slate-100 text-slate-600", in_progress: "bg-blue-100 text-blue-700", completed: "bg-emerald-100 text-emerald-700", delayed: "bg-rose-100 text-rose-700" };
  const statusLabels = { upcoming: "Pendente", in_progress: "Em andamento", completed: "Concluído", delayed: "Atrasado" };
  const milestoneTypeLabels = { kickoff: "Kickoff", review: "Revisão", delivery: "Entrega", approval: "Aprovação", launch: "Lançamento", other: "Outro" };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-700">{milestones.length} marco(s)</p>
        <Button size="sm" onClick={openNew} className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Novo Marco
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div> :
        milestones.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">Nenhum marco. Os marcos aparecem na timeline do cliente.</p> :
        <div className="space-y-2">
          {milestones.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                <p className="text-xs text-slate-400">{m.due_date ? format(new Date(m.due_date), "dd/MM/yyyy") : "—"} · {milestoneTypeLabels[m.milestone_type] || m.milestone_type}</p>
              </div>
              <Badge className={`text-[10px] ${statusColors[m.status] || "bg-slate-100 text-slate-500"}`}>{statusLabels[m.status] || m.status}</Badge>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(m)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"><Edit2 className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(m.id)} className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Marco" : "Novo Marco"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Título *</Label><Input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Tipo</Label>
                <Select value={form.milestone_type || "other"} onValueChange={v => setForm(f => ({ ...f, milestone_type: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(milestoneTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status || "upcoming"} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="delayed">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Data Prevista *</Label><Input type="date" value={form.due_date || ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs">Descrição</Label><Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 resize-none" /></div>
            <div><Label className="text-xs">Ordem de exibição</Label><Input type="number" value={form.order ?? 0} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="mt-1 w-24" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || !form.due_date || saveMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Onboarding ──────────────────────────────────────────────────────────────
function OnboardingManager({ projectId, companyId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin_onboarding", projectId],
    queryFn: () => base44.entities.OnboardingItem.filter({ project_id: projectId }),
    enabled: !!projectId,
    select: d => [...d].sort((a, b) => a.responsible_side?.localeCompare(b.responsible_side || "") || 0)
  });

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", item_type: "document", responsible_side: "client", status: "pending", due_date: "", notes: "" }); setOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...m }); setOpen(true); };

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? base44.entities.OnboardingItem.update(editing.id, form)
      : base44.entities.OnboardingItem.create({ ...form, project_id: projectId, company_id: companyId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_onboarding", projectId] }); setOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OnboardingItem.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_onboarding", projectId] })
  });

  const updateStatus = (item, status) => {
    base44.entities.OnboardingItem.update(item.id, { status })
      .then(() => qc.invalidateQueries({ queryKey: ["admin_onboarding", projectId] }));
  };

  const statusColors = { pending: "bg-slate-100 text-slate-600", in_progress: "bg-blue-100 text-blue-700", completed: "bg-emerald-100 text-emerald-700", blocked: "bg-rose-100 text-rose-700" };
  const statusLabels = { pending: "Pendente", in_progress: "Em andamento", completed: "Concluído", blocked: "Bloqueado" };
  const itemTypeLabels = { document: "Documento", access: "Acesso", information: "Informação", approval: "Aprovação", other: "Outro" };

  const clientItems = items.filter(i => i.responsible_side === "client");
  const destraItems = items.filter(i => i.responsible_side !== "client");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-700">{items.length} item(ns)</p>
        <Button size="sm" onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Novo Item
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div> :
        items.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">Nenhum item. Os itens aparecem na aba de Onboarding do cliente.</p> :
        <div className="space-y-4">
          {clientItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-2">🟦 Responsabilidade do Cliente</p>
              <div className="space-y-2">
                {clientItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                      <p className="text-xs text-slate-400">{itemTypeLabels[item.item_type] || item.item_type}{item.due_date ? ` · Prazo: ${format(new Date(item.due_date), "dd/MM/yyyy")}` : ""}</p>
                    </div>
                    <Select value={item.status} onValueChange={v => updateStatus(item, v)}>
                      <SelectTrigger className="h-7 text-xs w-28 border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(item.id)} className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {destraItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 mb-2">🟩 Responsabilidade da Destra</p>
              <div className="space-y-2">
                {destraItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                      <p className="text-xs text-slate-400">{itemTypeLabels[item.item_type] || item.item_type}{item.due_date ? ` · Prazo: ${format(new Date(item.due_date), "dd/MM/yyyy")}` : ""}</p>
                    </div>
                    <Select value={item.status} onValueChange={v => updateStatus(item, v)}>
                      <SelectTrigger className="h-7 text-xs w-28 border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(item.id)} className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Item" : "Novo Item de Onboarding"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div><Label className="text-xs">Título *</Label><Input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Responsável</Label>
                <Select value={form.responsible_side || "client"} onValueChange={v => setForm(f => ({ ...f, responsible_side: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="destra">Destra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Tipo</Label>
                <Select value={form.item_type || "document"} onValueChange={v => setForm(f => ({ ...f, item_type: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(itemTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status || "pending"} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Prazo</Label><Input type="date" value={form.due_date || ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs">Descrição</Label><Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 resize-none" /></div>
            <div><Label className="text-xs">Notas internas (não visíveis ao cliente)</Label><Textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1 resize-none" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Arquivos ─────────────────────────────────────────────────────────────────
function FilesManager({ projectId, companyId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["admin_files", projectId],
    queryFn: () => base44.entities.ProjectFile.filter({ project_id: projectId }),
    enabled: !!projectId,
    select: d => [...d].sort((a, b) => new Date(b.uploaded_at || b.created_date) - new Date(a.uploaded_at || a.created_date))
  });

  const openNew = () => {
    setForm({ title: "", file_url: "", file_type: "", category: "documentation", visible_to_client: true, description: "" });
    setOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url, title: f.title || file.name, file_type: file.type }));
    setUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.ProjectFile.create({
      ...form, project_id: projectId, company_id: companyId,
      uploaded_at: new Date().toISOString()
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin_files", projectId] }); setOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectFile.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_files", projectId] })
  });

  const toggleVisibility = (file) => {
    base44.entities.ProjectFile.update(file.id, { visible_to_client: !file.visible_to_client })
      .then(() => qc.invalidateQueries({ queryKey: ["admin_files", projectId] }));
  };

  const categoryLabels = { contract: "Contrato", presentation: "Apresentação", report: "Relatório", asset: "Material", documentation: "Documentação", other: "Outro" };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-700">{files.length} arquivo(s)</p>
        <Button size="sm" onClick={openNew} className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Adicionar Arquivo
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div> :
        files.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">Nenhum arquivo. Adicione arquivos que o cliente poderá baixar.</p> :
        <div className="space-y-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{f.title}</p>
                <p className="text-xs text-slate-400">{categoryLabels[f.category] || f.category}{f.uploaded_at ? ` · ${format(new Date(f.uploaded_at), "dd/MM/yyyy")}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!f.visible_to_client} onCheckedChange={() => toggleVisibility(f)} className="scale-75" title="Visível ao cliente" />
                <span className="text-[10px] text-slate-400">{f.visible_to_client ? "Visível" : "Oculto"}</span>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(f.id)} className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Adicionar Arquivo</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Upload de Arquivo</Label>
              <label className={`mt-1 flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition-colors ${uploading ? "opacity-50" : ""}`}>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Upload className="w-4 h-4 text-slate-400" />}
                <span className="text-xs text-slate-500">{form.file_url ? "Arquivo enviado ✓" : "Clique para selecionar"}</span>
              </label>
            </div>
            <div>
              <Label className="text-xs">Ou cole uma URL</Label>
              <Input value={form.file_url || ""} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." className="mt-1" />
            </div>
            <div><Label className="text-xs">Nome do Arquivo *</Label><Input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs">Descrição</Label><Input value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs">Categoria</Label>
              <Select value={form.category || "documentation"} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.visible_to_client} onCheckedChange={v => setForm(f => ({ ...f, visible_to_client: v }))} />
              <Label className="text-xs">Visível ao cliente</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || !form.file_url || saveMutation.isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tarefas (visibilidade + aprovação) ───────────────────────────────────────
function TasksVisibilityManager({ projectId, contactId }) {
  const qc = useQueryClient();
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["admin_project_tasks", projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
    select: d => d.filter(t => !t.parent_task_id).sort((a, b) => a.title.localeCompare(b.title))
  });

  // Busca o acesso do contato neste projeto para o toggle auto_visible
  const { data: accessList = [] } = useQuery({
    queryKey: ["pcm_access_project", contactId, projectId],
    queryFn: () => base44.entities.ProjectClientAccess.filter({ client_contact_id: contactId, project_id: projectId }),
    enabled: !!contactId && !!projectId
  });
  const access = accessList[0];

  const toggleAutoVisible = (v) => {
    if (!access) return;
    base44.entities.ProjectClientAccess.update(access.id, { auto_visible_tasks: v })
      .then(() => qc.invalidateQueries({ queryKey: ["pcm_access_project", contactId, projectId] }));
  };

  const toggleVisibility = (task) => {
    base44.entities.Task.update(task.id, { visible_to_client: !task.visible_to_client })
      .then(() => qc.invalidateQueries({ queryKey: ["admin_project_tasks", projectId] }));
  };

  const toggleApproval = (task) => {
    base44.entities.Task.update(task.id, { approval_required: !task.approval_required })
      .then(() => qc.invalidateQueries({ queryKey: ["admin_project_tasks", projectId] }));
  };

  const handleBulkVisibility = async (visible) => {
    setBulkLoading(true);
    await Promise.all(tasks.map(t => base44.entities.Task.update(t.id, { visible_to_client: visible })));
    qc.invalidateQueries({ queryKey: ["admin_project_tasks", projectId] });
    setBulkLoading(false);
  };

  const handleBulkApproval = async (required) => {
    setBulkLoading(true);
    await Promise.all(tasks.map(t => base44.entities.Task.update(t.id, { approval_required: required })));
    qc.invalidateQueries({ queryKey: ["admin_project_tasks", projectId] });
    setBulkLoading(false);
  };

  const statusColors = { pending: "bg-slate-100 text-slate-500", in_progress: "bg-blue-100 text-blue-700", completed: "bg-emerald-100 text-emerald-700" };
  const statusLabels = { pending: "Pendente", in_progress: "Em andamento", completed: "Concluído" };
  const visible = tasks.filter(t => t.visible_to_client);
  const withApproval = tasks.filter(t => t.approval_required);

  return (
    <div className="space-y-4">
      {/* Ações em massa */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações em Massa</p>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => handleBulkVisibility(true)} disabled={bulkLoading || tasks.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8">
            {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Liberar todas ao cliente
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkVisibility(false)} disabled={bulkLoading || tasks.length === 0}
            className="text-xs gap-1.5 h-8 border-slate-300 text-slate-600 hover:bg-slate-100">
            Ocultar todas
          </Button>
          <Button size="sm" onClick={() => handleBulkApproval(true)} disabled={bulkLoading || tasks.length === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 h-8">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprovar todas
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkApproval(false)} disabled={bulkLoading || tasks.length === 0}
            className="text-xs gap-1.5 h-8 border-slate-300 text-slate-600 hover:bg-slate-100">
            Remover aprovação
          </Button>
        </div>

        {/* Auto-visibilidade */}
        {access && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
            <Switch checked={!!access.auto_visible_tasks} onCheckedChange={toggleAutoVisible} />
            <div>
              <p className="text-xs font-medium text-slate-700">Novas tarefas visíveis automaticamente</p>
              <p className="text-[10px] text-slate-400">Toda tarefa nova criada neste projeto já aparecerá para o cliente</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        {visible.length > 0 && <span className="text-blue-600 font-medium">{visible.length}/{tasks.length} visível(eis)</span>}
        {withApproval.length > 0 && <span className="ml-2 text-purple-600 font-medium">· {withApproval.length} com aprovação</span>}
      </p>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div> :
        tasks.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-400">Nenhuma tarefa neste projeto.</p>
            <p className="text-xs text-slate-400 mt-1">Crie tarefas no projeto para liberá-las ao cliente.</p>
          </div>
        ) :
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className={`p-3 bg-white border rounded-xl transition-all ${task.visible_to_client ? "border-blue-200 bg-blue-50/30" : "border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <Switch checked={!!task.visible_to_client} onCheckedChange={() => toggleVisibility(task)} className="scale-75 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                  {task.client_facing_title && task.client_facing_title !== task.title && (
                    <p className="text-xs text-blue-600 truncate">→ Cliente vê: "{task.client_facing_title}"</p>
                  )}
                  <p className="text-xs text-slate-400">{statusLabels[task.status] || task.status}</p>
                </div>
                <Badge className={`text-[10px] flex-shrink-0 ${statusColors[task.status] || "bg-slate-100 text-slate-500"}`}>
                  {statusLabels[task.status] || task.status}
                </Badge>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Switch checked={!!task.approval_required} onCheckedChange={() => toggleApproval(task)} className="scale-75" />
                  <span className="text-[10px] text-slate-400">Aprovação</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ─── Avaliações recebidas ─────────────────────────────────────────────────────
function SurveysViewer({ projectId }) {
  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ["admin_surveys", projectId],
    queryFn: () => base44.entities.SatisfactionSurvey.filter({ project_id: projectId }),
    enabled: !!projectId,
    select: d => [...d].sort((a, b) => new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date))
  });

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  if (surveys.length === 0) return <p className="text-xs text-slate-400 text-center py-6">Nenhuma avaliação recebida ainda.</p>;

  const avg = (surveys.reduce((s, sv) => s + (sv.overall_score || 0), 0) / surveys.length).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
        <div>
          <p className="text-lg font-bold text-amber-600">{avg}/10</p>
          <p className="text-xs text-slate-500">{surveys.length} avaliação(ões)</p>
        </div>
      </div>
      {surveys.map(s => (
        <div key={s.id} className="bg-white border border-slate-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-amber-500">{s.overall_score}/10</span>
            <span className="text-xs text-slate-400">{s.submitted_at ? format(new Date(s.submitted_at), "dd/MM/yyyy") : "—"}</span>
          </div>
          {s.comment && <p className="text-sm text-slate-600">{s.comment}</p>}
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-500">
            {s.communication_score && <span>Comunicação: {s.communication_score}/10</span>}
            {s.timeline_score && <span>Prazos: {s.timeline_score}/10</span>}
            {s.quality_score && <span>Qualidade: {s.quality_score}/10</span>}
            {s.result_score && <span>Resultados: {s.result_score}/10</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function PortalContentManager({ contact, projects, companies, defaultProjectId }) {
  const { data: accessList = [] } = useQuery({
    queryKey: ["pcm_access", contact?.id],
    queryFn: () => base44.entities.ProjectClientAccess.filter({ client_contact_id: contact.id }),
    enabled: !!contact?.id
  });

  const accessedProjectIds = accessList.map(a => a.project_id);
  // When called with a single project (from ClientProjectSettings), use it directly without filtering by access
  const accessedProjects = defaultProjectId
    ? projects.filter(p => p.id === defaultProjectId)
    : projects.filter(p => accessedProjectIds.includes(p.id));

  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId || null);
  const activeProjectId = selectedProjectId || accessedProjects[0]?.id;
  const activeProject = accessedProjects.find(p => p.id === activeProjectId);
  const activeCompanyId = activeProject?.company_id;

  if (!contact) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Gerencie o conteúdo que <strong>{contact.name}</strong> vê no portal.
          {accessedProjects.length === 0 && " ⚠️ Nenhum projeto liberado para este contato — vincule um projeto acima."}
        </p>
      </div>

      {accessedProjects.length === 0 ? null : (
        <>
          {accessedProjects.length > 1 && (
            <Select value={activeProjectId || ""} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
              <SelectContent>
                {accessedProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {activeProject && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{activeProject.name}</p>
                <p className="text-xs text-slate-500">{activeProject.status} · {activeProject.progress_percentage || 0}% concluído</p>
              </div>
              <Badge className={activeProject.client_portal_enabled ? "bg-emerald-100 text-emerald-700 text-[10px]" : "bg-slate-100 text-slate-500 text-[10px]"}>
                {activeProject.client_portal_enabled ? "Portal ativo" : "Portal inativo"}
              </Badge>
            </div>
          )}

          {activeProjectId && (
            <Tabs defaultValue="project">
              <TabsList className="w-full grid grid-cols-4 sm:grid-cols-8 bg-white border border-slate-200 rounded-xl p-1 h-auto gap-0.5">
                {[
                  { value: "project",    label: "Projeto",   icon: FolderOpen,      color: "data-[state=active]:bg-slate-700" },
                  { value: "tasks",      label: "Tarefas",   icon: ClipboardList,   color: "data-[state=active]:bg-blue-600" },
                  { value: "clientasks", label: "P/ Cliente",icon: ClipboardCheck,  color: "data-[state=active]:bg-violet-600" },
                  { value: "meetings",   label: "Reuniões",  icon: Calendar,        color: "data-[state=active]:bg-blue-600" },
                  { value: "milestones", label: "Timeline",  icon: Flag,            color: "data-[state=active]:bg-purple-600" },
                  { value: "onboarding", label: "Onboard.",  icon: CheckCircle2,    color: "data-[state=active]:bg-emerald-600" },
                  { value: "files",      label: "Arquivos",  icon: File,            color: "data-[state=active]:bg-amber-600" },
                  { value: "courses",    label: "Cursos",    icon: GraduationCap,   color: "data-[state=active]:bg-indigo-600" },
                ].map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className={`text-[10px] flex flex-col gap-0.5 py-2 rounded-lg ${tab.color} data-[state=active]:text-white`}>
                    <tab.icon className="w-3.5 h-3.5 mx-auto" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="mt-3">
                <TabsContent value="project"><ProjectEditor project={activeProject} /></TabsContent>
                <TabsContent value="tasks"><TasksVisibilityManager projectId={activeProjectId} contactId={contact?.id} /></TabsContent>
                <TabsContent value="clientasks"><ClientTasksManager projectId={activeProjectId} companyId={activeCompanyId} /></TabsContent>
                <TabsContent value="meetings"><MeetingsManager projectId={activeProjectId} companyId={activeCompanyId} /></TabsContent>
                <TabsContent value="milestones"><MilestonesManager projectId={activeProjectId} companyId={activeCompanyId} /></TabsContent>
                <TabsContent value="onboarding"><OnboardingManager projectId={activeProjectId} companyId={activeCompanyId} /></TabsContent>
                <TabsContent value="files"><FilesManager projectId={activeProjectId} companyId={activeCompanyId} /></TabsContent>
                <TabsContent value="courses"><CoursesManager companyId={activeCompanyId} /></TabsContent>
              </div>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}