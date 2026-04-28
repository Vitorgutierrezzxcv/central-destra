/**
 * CoursesManager — gerencia coleções e aulas de cursos no portal do cliente.
 * Permite criar/editar/deletar CourseCollections e CourseLessons,
 * com upload de vídeo e thumbnail.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Edit2, ChevronDown, ChevronRight,
  Upload, Loader2, PlayCircle, BookOpen, GraduationCap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const categoryLabels = {
  tutorial: "Tutorial",
  mentoria: "Mentoria",
  treinamento: "Treinamento",
  outro: "Outro",
};

// ─── Upload helper ────────────────────────────────────────────────────────────
function UploadField({ label, value, onChange, accept = "*", placeholder = "https://..." }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-xs"
        />
        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs text-slate-600 transition-colors flex-shrink-0 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <input type="file" accept={accept} className="hidden" onChange={handleUpload} disabled={uploading} />
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? "..." : "Upload"}
        </label>
      </div>
    </div>
  );
}

// ─── Lesson Form Dialog ───────────────────────────────────────────────────────
function LessonDialog({ open, onClose, lesson, collectionId, onSaved }) {
  const isEdit = !!lesson?.id;
  const [form, setForm] = useState(() => lesson || {
    title: "", description: "", video_url: "", thumbnail_url: "",
    duration_minutes: "", order: 0, is_active: true, tags: []
  });

  React.useEffect(() => {
    if (open) setForm(lesson || { title: "", description: "", video_url: "", thumbnail_url: "", duration_minutes: "", order: 0, is_active: true, tags: [] });
  }, [open, lesson]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      collection_id: collectionId,
      duration_minutes: form.duration_minutes ? parseFloat(form.duration_minutes) : null,
      order: parseInt(form.order) || 0,
    };
    if (isEdit) {
      await base44.entities.CourseLesson.update(lesson.id, data);
    } else {
      await base44.entities.CourseLesson.create(data);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Aula" : "Nova Aula"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 resize-none" />
          </div>

          <UploadField
            label="URL do Vídeo *"
            value={form.video_url}
            onChange={v => setForm(f => ({ ...f, video_url: v }))}
            accept="video/*"
            placeholder="https://youtube.com/... ou https://vimeo.com/..."
          />

          <UploadField
            label="Thumbnail"
            value={form.thumbnail_url}
            onChange={v => setForm(f => ({ ...f, thumbnail_url: v }))}
            accept="image/*"
            placeholder="https://..."
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Duração (minutos)</Label>
              <Input type="number" value={form.duration_minutes || ""} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} className="mt-1" placeholder="Ex: 15" />
            </div>
            <div>
              <Label className="text-xs">Ordem</Label>
              <Input type="number" value={form.order ?? 0} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} className="mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={!!form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label className="text-xs">Aula ativa (visível no portal)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={!form.title || !form.video_url || saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Collection row ───────────────────────────────────────────────────────────
function CollectionRow({ collection, companyId, allLessons, onRefresh }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ...collection });
  const [saving, setSaving] = useState(false);

  const lessons = allLessons
    .filter(l => l.collection_id === collection.id)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const handleDeleteLesson = async (id) => {
    await base44.entities.CourseLesson.delete(id);
    onRefresh();
  };

  const handleDeleteCollection = async () => {
    // Deleta todas as aulas da coleção
    await Promise.all(lessons.map(l => base44.entities.CourseLesson.delete(l.id)));
    await base44.entities.CourseCollection.delete(collection.id);
    onRefresh();
  };

  const handleSaveCollection = async () => {
    setSaving(true);
    await base44.entities.CourseCollection.update(collection.id, {
      ...editForm,
      order: parseInt(editForm.order) || 0,
    });
    setSaving(false);
    setEditOpen(false);
    onRefresh();
  };

  const toggleActive = async () => {
    await base44.entities.CourseCollection.update(collection.id, { is_active: !collection.is_active });
    onRefresh();
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Collection header */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
        <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {collection.thumbnail_url
            ? <img src={collection.thumbnail_url} alt="" className="w-full h-full object-cover" />
            : <BookOpen className="w-4 h-4 text-white/50" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{collection.title}</p>
          <p className="text-[10px] text-slate-400">{lessons.length} aula(s) · {categoryLabels[collection.category] || collection.category}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <Badge className={collection.is_active ? "bg-emerald-100 text-emerald-700 text-[10px]" : "bg-slate-100 text-slate-500 text-[10px]"}>
            {collection.is_active ? "Ativa" : "Inativa"}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => { setEditForm({ ...collection }); setEditOpen(true); }} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDeleteCollection} className="h-7 w-7 p-0 text-rose-400 hover:text-rose-600">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Lessons */}
      {expanded && (
        <div className="p-3 border-t border-slate-100 space-y-2 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{lessons.length} aula(s)</p>
            <Button size="sm" onClick={() => { setEditingLesson(null); setLessonDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs h-7">
              <Plus className="w-3 h-3" /> Nova Aula
            </Button>
          </div>

          {lessons.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Nenhuma aula. Clique em "Nova Aula" para adicionar.</p>
          ) : (
            <div className="space-y-1.5">
              {lessons.map((lesson, i) => (
                <div key={lesson.id} className="flex items-center gap-3 p-2.5 border border-slate-100 rounded-lg bg-slate-50">
                  <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-slate-900 flex items-center justify-center">
                    {lesson.thumbnail_url
                      ? <img src={lesson.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      : <PlayCircle className="w-3.5 h-3.5 text-white/40" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{lesson.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {lesson.duration_minutes ? `${lesson.duration_minutes} min · ` : ""}
                      Ordem: {lesson.order ?? i}
                      {!lesson.is_active && " · Inativa"}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingLesson(lesson); setLessonDialogOpen(true); }} className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700">
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteLesson(lesson.id)} className="h-6 w-6 p-0 text-rose-400 hover:text-rose-600">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lesson dialog */}
      <LessonDialog
        open={lessonDialogOpen}
        onClose={() => setLessonDialogOpen(false)}
        lesson={editingLesson}
        collectionId={collection.id}
        onSaved={onRefresh}
      />

      {/* Edit collection dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Coleção</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs">Título *</Label>
              <Input value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 resize-none" />
            </div>
            <UploadField
              label="Thumbnail"
              value={editForm.thumbnail_url}
              onChange={v => setEditForm(f => ({ ...f, thumbnail_url: v }))}
              accept="image/*"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={editForm.category || "tutorial"} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ordem</Label>
                <Input type="number" value={editForm.order ?? 0} onChange={e => setEditForm(f => ({ ...f, order: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Visível apenas para empresa (ID)</Label>
              <Input value={editForm.company_id || ""} onChange={e => setEditForm(f => ({ ...f, company_id: e.target.value || null }))} className="mt-1" placeholder="Deixe vazio para todos os clientes" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!editForm.is_active} onCheckedChange={v => setEditForm(f => ({ ...f, is_active: v }))} />
              <Label className="text-xs">Coleção ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCollection} disabled={!editForm.title || saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function CoursesManager({ companyId }) {
  const qc = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", description: "", thumbnail_url: "", category: "tutorial", order: 0, is_active: true, company_id: companyId || "" });
  const [saving, setSaving] = useState(false);

  const { data: collections = [], refetch: refetchCollections } = useQuery({
    queryKey: ["admin_courses_collections"],
    queryFn: () => base44.entities.CourseCollection.list(),
    select: d => [...d].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  });

  const { data: lessons = [], refetch: refetchLessons } = useQuery({
    queryKey: ["admin_courses_lessons"],
    queryFn: () => base44.entities.CourseLesson.list(),
  });

  const refresh = () => {
    refetchCollections();
    refetchLessons();
  };

  const handleCreateCollection = async () => {
    setSaving(true);
    await base44.entities.CourseCollection.create({
      ...newForm,
      order: parseInt(newForm.order) || 0,
      company_id: newForm.company_id || null,
    });
    setSaving(false);
    setNewOpen(false);
    setNewForm({ title: "", description: "", thumbnail_url: "", category: "tutorial", order: 0, is_active: true, company_id: companyId || "" });
    refresh();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">{collections.length} coleção(ões) · {lessons.length} aula(s)</p>
          <p className="text-xs text-slate-400 mt-0.5">Coleções sem empresa vinculada aparecem para todos os clientes.</p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Nova Coleção
        </Button>
      </div>

      {/* Collections list */}
      {collections.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
          <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nenhuma coleção criada.</p>
          <p className="text-xs text-slate-400 mt-1">Crie uma coleção para organizar as aulas do portal.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {collections.map(col => (
            <CollectionRow
              key={col.id}
              collection={col}
              companyId={companyId}
              allLessons={lessons}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* New collection dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Coleção</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs">Título *</Label>
              <Input value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} className="mt-1" placeholder="Ex: Tutoriais de gestão de tráfego" />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea value={newForm.description || ""} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 resize-none" />
            </div>
            <UploadField
              label="Thumbnail"
              value={newForm.thumbnail_url}
              onChange={v => setNewForm(f => ({ ...f, thumbnail_url: v }))}
              accept="image/*"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={newForm.category} onValueChange={v => setNewForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ordem</Label>
                <Input type="number" value={newForm.order} onChange={e => setNewForm(f => ({ ...f, order: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Restringir a empresa específica (opcional)</Label>
              <Input
                value={newForm.company_id || ""}
                onChange={e => setNewForm(f => ({ ...f, company_id: e.target.value }))}
                className="mt-1"
                placeholder="ID da empresa — deixe vazio para todos"
              />
              <p className="text-[10px] text-slate-400 mt-1">Deixe vazio para que a coleção apareça para todos os clientes.</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!newForm.is_active} onCheckedChange={v => setNewForm(f => ({ ...f, is_active: v }))} />
              <Label className="text-xs">Coleção ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateCollection} disabled={!newForm.title || saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving ? "Criando..." : "Criar Coleção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}