/**
 * PortalContentManager — painel admin para gerenciar o conteúdo que o cliente vê:
 * reuniões, marcos (timeline), onboarding, arquivos, e entregas de tarefas.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Flag, ClipboardList, File, Plus, Trash2, Edit2, CheckCircle2,
  Clock, Upload, Link, ChevronDown, ChevronUp, Loader2, Package
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

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
    setForm({ title: "", meeting_type: "weekly", start_datetime: "", end_datetime: "", meeting_link: "", location: "", description: "", status: "scheduled", visible_to_client: true });
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

  const statusColors = { scheduled: "bg-blue-100 text-blue-700", completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-slate-100 text-slate-500" };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-700">{meetings.length} reunião(ões)</p>
        <Button size="sm" onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Nova Reunião
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div> :
        meetings.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">Nenhuma reunião cadastrada.</p> :
        <div className="space-y-2">
          {meetings.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                <p className="text-xs text-slate-400">
                  {m.start_datetime ? format(new Date(m.start_datetime), "dd/MM/yyyy HH:mm") : "—"}
                  {m.meeting_link && <span className="ml-2 text-blue-500">• Com link</span>}
                </p>
              </div>
              <Badge className={`text-[10px] ${statusColors[m.status] || "bg-slate-100 text-slate-500"}`}>{m.status}</Badge>
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
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Reunião" : "Nova Reunião"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div><Label className="text-xs">Título *</Label><Input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Tipo</Label>
                <Select value={form.meeting_type || "weekly"} onValueChange={v => setForm(f => ({ ...f, meeting_type: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["kickoff","weekly","review","presentation","onboarding","ad_hoc"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Data/Hora Início</Label><Input type="datetime-local" value={form.start_datetime ? form.start_datetime.slice(0,16) : ""} onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))} className="mt-1" /></div>
              <div><Label className="text-xs">Data/Hora Fim</Label><Input type="datetime-local" value={form.end_datetime ? form.end_datetime.slice(0,16) : ""} onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label className="text-xs">Link da Reunião (Google Meet, Zoom...)</Label><Input value={form.meeting_link || ""} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://meet.google.com/..." className="mt-1" /></div>
            <div><Label className="text-xs">Local / Endereço</Label><Input value={form.location || ""} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Opcional" className="mt-1" /></div>
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-700">{milestones.length} marco(s)</p>
        <Button size="sm" onClick={openNew} className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Novo Marco
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div> :
        milestones.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">Nenhum marco cadastrado. Os marcos aparecem na timeline do cliente.</p> :
        <div className="space-y-2">
          {milestones.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                <p className="text-xs text-slate-400">{m.due_date ? format(new Date(m.due_date), "dd/MM/yyyy") : "—"} · {m.milestone_type}</p>
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
                    {["kickoff","review","delivery","approval","launch","other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
            <div><Label className="text-xs">Data Prevista</Label><Input type="date" value={form.due_date || ""} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs">Descrição</Label><Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 resize-none" /></div>
            <div><Label className="text-xs">Ordem de exibição</Label><Input type="number" value={form.order ?? 0} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="mt-1" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.visible_to_client} onCheckedChange={v => setForm(f => ({ ...f, visible_to_client: v }))} />
              <Label className="text-xs">Visível ao cliente</Label>
            </div>
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
    select: d => [...d].sort((a, b) => a.responsible_side.localeCompare(b.responsible_side))
  });

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", item_type: "document", responsible_side: "client", status: "pending", due_date: "", attachment_required: false, notes: "" }); setOpen(true); };
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

  const statusColors = { pending: "bg-slate-100 text-slate-600", in_progress: "bg-blue-100 text-blue-700", completed: "bg-emerald-100 text-emerald-700", blocked: "bg-rose-100 text-rose-700" };
  const statusLabels = { pending: "Pendente", in_progress: "Em andamento", completed: "Concluído", blocked: "Bloqueado" };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-700">{items.length} item(ns) de onboarding</p>
        <Button size="sm" onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Novo Item
        </Button>
      </div>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div> :
        items.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">Nenhum item de onboarding. Os itens aparecem na aba de Onboarding do cliente.</p> :
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                <p className="text-xs text-slate-400">{item.responsible_side === "client" ? "🟦 Cliente" : "🟩 Destra"} · {item.item_type}</p>
              </div>
              <Badge className={`text-[10px] ${statusColors[item.status] || "bg-slate-100 text-slate-500"}`}>{statusLabels[item.status] || item.status}</Badge>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"><Edit2 className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(item.id)} className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
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
                    <SelectItem value="document">Documento</SelectItem>
                    <SelectItem value="access">Acesso</SelectItem>
                    <SelectItem value="information">Informação</SelectItem>
                    <SelectItem value="approval">Aprovação</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
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
            <div><Label className="text-xs">Notas internas</Label><Textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1 resize-none" /></div>
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
    setForm({ title: "", file_url: "", file_type: "", category: "documentation", visible_to_client: true, uploaded_by: "" });
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
                <p className="text-xs text-slate-400">{f.category} · {f.uploaded_at ? format(new Date(f.uploaded_at), "dd/MM/yyyy") : "—"}</p>
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
            <div><Label className="text-xs">Categoria</Label>
              <Select value={form.category || "documentation"} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["contract","presentation","report","asset","documentation","other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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

// ─── Tarefas do projeto (para entregas) ───────────────────────────────────────
function TasksVisibilityManager({ projectId }) {
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["admin_project_tasks", projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
    select: d => d.filter(t => !t.parent_task_id) // só tarefas principais
  });

  const toggleVisibility = (task) => {
    base44.entities.Task.update(task.id, { visible_to_client: !task.visible_to_client })
      .then(() => qc.invalidateQueries({ queryKey: ["admin_project_tasks", projectId] }));
  };

  const statusLabels = { pending: "Pendente", in_progress: "Em andamento", completed: "Concluído" };

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Ative a visibilidade de cada tarefa para que o cliente veja nas abas Entregas e Timeline.</p>

      {isLoading ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div> :
        tasks.length === 0 ? <p className="text-xs text-slate-400 text-center py-6">Nenhuma tarefa neste projeto.</p> :
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                <p className="text-xs text-slate-400">{statusLabels[task.status] || task.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!task.visible_to_client} onCheckedChange={() => toggleVisibility(task)} className="scale-75" />
                <span className="text-[10px] text-slate-400">{task.visible_to_client ? "Visível" : "Oculta"}</span>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function PortalContentManager({ contact, projects, companies }) {
  const contactAccess = useQuery({
    queryKey: ["pcm_access", contact?.id],
    queryFn: () => base44.entities.ProjectClientAccess.filter({ client_contact_id: contact.id }),
    enabled: !!contact?.id
  });

  const accessList = contactAccess.data || [];
  const accessedProjectIds = accessList.map(a => a.project_id);
  const accessedProjects = projects.filter(p => accessedProjectIds.includes(p.id));

  const [selectedProjectId, setSelectedProjectId] = useState(null);
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
          {accessedProjects.length === 0 && " ⚠️ Nenhum projeto liberado para este contato."}
        </p>
      </div>

      {accessedProjects.length > 1 && (
        <Select value={activeProjectId || ""} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="text-sm"><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
          <SelectContent>
            {accessedProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {activeProject && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">{activeProject.name}</p>
            <p className="text-xs text-slate-500">{activeProject.status} · {activeProject.progress_percentage || 0}% concluído</p>
          </div>
        </div>
      )}

      {activeProjectId && (
        <Tabs defaultValue="tasks">
          <TabsList className="w-full grid grid-cols-5 bg-white border border-slate-200 rounded-xl p-1 h-auto gap-1">
            <TabsTrigger value="tasks" className="text-[10px] flex flex-col gap-0.5 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <ClipboardList className="w-3.5 h-3.5 mx-auto" /> Tarefas
            </TabsTrigger>
            <TabsTrigger value="meetings" className="text-[10px] flex flex-col gap-0.5 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Calendar className="w-3.5 h-3.5 mx-auto" /> Reuniões
            </TabsTrigger>
            <TabsTrigger value="milestones" className="text-[10px] flex flex-col gap-0.5 py-2 rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Flag className="w-3.5 h-3.5 mx-auto" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="text-[10px] flex flex-col gap-0.5 py-2 rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 mx-auto" /> Onboarding
            </TabsTrigger>
            <TabsTrigger value="files" className="text-[10px] flex flex-col gap-0.5 py-2 rounded-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <File className="w-3.5 h-3.5 mx-auto" /> Arquivos
            </TabsTrigger>
          </TabsList>
          <div className="mt-3">
            <TabsContent value="tasks"><TasksVisibilityManager projectId={activeProjectId} /></TabsContent>
            <TabsContent value="meetings"><MeetingsManager projectId={activeProjectId} companyId={activeCompanyId} /></TabsContent>
            <TabsContent value="milestones"><MilestonesManager projectId={activeProjectId} companyId={activeCompanyId} /></TabsContent>
            <TabsContent value="onboarding"><OnboardingManager projectId={activeProjectId} companyId={activeCompanyId} /></TabsContent>
            <TabsContent value="files"><FilesManager projectId={activeProjectId} companyId={activeCompanyId} /></TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}