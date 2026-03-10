import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, UserCheck, UserX, Shield, ShieldCheck, RefreshCw,
  ChevronDown, ChevronUp, Edit2, Save, X, Copy, CheckCheck, Link2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

function getPortalLink() {
  return `${window.location.origin}/ClientPortalLogin`;
}

// Formulário para criar/editar contato
function ContactFormDialog({ open, onClose, contact, companies, projects }) {
  const qc = useQueryClient();
  const isEdit = !!contact?.id;
  const [form, setForm] = useState(contact || {
    name: "", email: "", role: "", phone: "", company_id: "", access_level: "client_user", status: "pending_invite"
  });
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [inviteError, setInviteError] = useState("");
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      setInviteError("");
      if (isEdit) {
        return base44.entities.ClientContact.update(contact.id, data);
      }

      // 1. Criar ClientContact
      const saved = await base44.entities.ClientContact.create({
        ...data,
        status: "pending_invite",
        invited_at: new Date().toISOString()
      });

      // 2. Convidar usuário para a plataforma (role base é "user"; o acesso de cliente é controlado pelo UserProfile)
      await base44.users.inviteUser(data.email, "user");

      // 3. Criar UserProfile vinculando email → empresa → contato
      await base44.entities.UserProfile.create({
        user_email: data.email,
        display_name: data.name,
        full_name: data.name,
        portal_type: "client",
        linked_company_id: data.company_id,
        linked_client_contact_id: saved.id
      });

      // 4. Criar acesso aos projetos selecionados
      for (const pid of selectedProjects) {
        await base44.entities.ProjectClientAccess.create({
          project_id: pid,
          company_id: data.company_id,
          client_contact_id: saved.id,
          can_view: true,
          can_comment: true,
          can_approve: data.access_level === "client_approver",
          can_rate: true,
          can_view_files: true,
          can_view_calendar: true,
          is_active: true
        });
      }
      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_client_contacts"] });
      qc.invalidateQueries({ queryKey: ["admin_project_access"] });
      onClose();
    },
    onError: (err) => {
      setInviteError(err?.message || "Erro ao criar contato. Verifique os dados e tente novamente.");
    }
  });

  const companyProjects = projects.filter(p => p.company_id === form.company_id);

  const toggleProject = (pid) => {
    setSelectedProjects(prev =>
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Contato" : "Novo Contato Cliente"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Email *</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Cargo</Label>
              <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Diretor, Gerente..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Empresa *</Label>
            <Select value={form.company_id} onValueChange={v => { setForm(f => ({ ...f, company_id: v })); setSelectedProjects([]); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
              <SelectContent>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Nível de Acesso</Label>
            <Select value={form.access_level} onValueChange={v => setForm(f => ({ ...f, access_level: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="client_user">Visualizador — pode ver e comentar</SelectItem>
                <SelectItem value="client_approver">Aprovador — pode aprovar, reprovar e avaliar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isEdit && form.company_id && companyProjects.length > 0 && (
            <div>
              <Label className="text-xs">Projetos Liberados</Label>
              <div className="mt-1 space-y-2">
                {companyProjects.filter(p => p.client_portal_enabled).map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(p.id)}
                      onChange={() => toggleProject(p.id)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                  </label>
                ))}
                {companyProjects.filter(p => p.client_portal_enabled).length === 0 && (
                  <p className="text-xs text-slate-400 py-2">Nenhum projeto com portal ativo nesta empresa.</p>
                )}
              </div>
            </div>
          )}
        </div>
        {inviteError && (
          <div className="px-1 py-2 text-sm text-rose-500 bg-rose-50 rounded-lg px-3">{inviteError}</div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={!form.name || !form.email || !form.company_id || saveMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saveMutation.isPending ? "Enviando convite..." : isEdit ? "Salvar" : "Criar e Convidar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Linha de acesso a projeto — permissões editáveis inline
function ProjectAccessRow({ access, project, contact, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [perms, setPerms] = useState(access);

  const handleSave = () => {
    onUpdate(access.id, perms);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{project?.name || access.project_id}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {editing ? (
            <div className="flex flex-wrap gap-3 mt-1">
              {[
                { key: "can_comment", label: "Comentar" },
                { key: "can_approve", label: "Aprovar" },
                { key: "can_rate", label: "Avaliar" },
                { key: "can_view_files", label: "Arquivos" },
                { key: "can_view_calendar", label: "Calendário" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!perms[key]}
                    onChange={e => setPerms(p => ({ ...p, [key]: e.target.checked }))}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          ) : (
            <>
              {access.can_comment && <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Comentar</Badge>}
              {access.can_approve && <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">Aprovar</Badge>}
              {access.can_rate && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Avaliar</Badge>}
              {access.can_view_files && <Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">Arquivos</Badge>}
              {access.can_view_calendar && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Calendário</Badge>}
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Switch
          checked={!!access.is_active}
          onCheckedChange={v => onUpdate(access.id, { is_active: v })}
          className="scale-75"
        />
        {editing ? (
          <>
            <Button size="sm" variant="ghost" onClick={handleSave} className="text-emerald-600 hover:text-emerald-700 h-7 w-7 p-0">
              <Save className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="text-slate-400 h-7 w-7 p-0">
              <X className="w-3.5 h-3.5" />
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-slate-400 hover:text-slate-700 h-7 w-7 p-0">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onRemove(access.id)} className="text-rose-400 hover:text-rose-600 h-7 w-7 p-0">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// Card de contato expandível
function ContactCard({ contact, companies, projects, allAccess }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [newProjectId, setNewProjectId] = useState("");

  const company = companies.find(c => c.id === contact.company_id);
  const contactAccess = allAccess.filter(a => a.client_contact_id === contact.id);
  const companyProjects = projects.filter(p => p.company_id === contact.company_id && p.client_portal_enabled);
  const accessedIds = contactAccess.map(a => a.project_id);
  const availableProjects = companyProjects.filter(p => !accessedIds.includes(p.id));

  const toggleStatusMutation = useMutation({
    mutationFn: () => base44.entities.ClientContact.update(contact.id, {
      status: contact.status === "active" ? "inactive" : "active"
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_client_contacts"] })
  });

  const updateAccessMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectClientAccess.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_project_access"] })
  });

  const removeAccessMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectClientAccess.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_project_access"] })
  });

  const addProjectMutation = useMutation({
    mutationFn: () => base44.entities.ProjectClientAccess.create({
      project_id: newProjectId,
      company_id: contact.company_id,
      client_contact_id: contact.id,
      can_view: true,
      can_comment: true,
      can_approve: contact.access_level === "client_approver",
      can_rate: true,
      can_view_files: true,
      can_view_calendar: true,
      is_active: true
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_project_access"] });
      setAddProjectOpen(false);
      setNewProjectId("");
    }
  });

  const statusColor = contact.status === "active"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : contact.status === "inactive"
      ? "bg-slate-100 text-slate-600 border-slate-200"
      : "bg-amber-100 text-amber-700 border-amber-200";

  const statusLabel = { active: "Ativo", inactive: "Inativo", pending_invite: "Aguardando" };
  const accessLabel = contact.access_level === "client_approver" ? "Aprovador" : "Visualizador";
  const accessColor2 = contact.access_level === "client_approver"
    ? "bg-purple-100 text-purple-700 border-purple-200"
    : "bg-blue-100 text-blue-700 border-blue-200";

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
          {contact.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
          <p className="text-xs text-slate-500">{contact.email}</p>
          {company && <p className="text-xs text-slate-400">{company.name}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={accessColor2}>{accessLabel}</Badge>
          <Badge className={statusColor}>{statusLabel[contact.status] || contact.status}</Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={e => { e.stopPropagation(); toggleStatusMutation.mutate(); }}
            className={contact.status === "active" ? "text-rose-400 hover:text-rose-600" : "text-emerald-600 hover:text-emerald-700"}
          >
            {contact.status === "active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={e => { e.stopPropagation(); setEditOpen(true); }}
            className="text-slate-400 hover:text-slate-700"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Projetos Liberados</p>
            {availableProjects.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAddProjectOpen(!addProjectOpen)}
                className="text-blue-600 hover:text-blue-700 gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Projeto
              </Button>
            )}
          </div>

          {addProjectOpen && (
            <div className="flex items-center gap-2 p-3 bg-white border border-blue-100 rounded-xl">
              <Select value={newProjectId} onValueChange={setNewProjectId}>
                <SelectTrigger className="flex-1 h-8 text-sm">
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => addProjectMutation.mutate()}
                disabled={!newProjectId || addProjectMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700 h-8"
              >
                Liberar
              </Button>
            </div>
          )}

          {contactAccess.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Nenhum projeto liberado.</p>
          ) : (
            <div className="space-y-2">
              {contactAccess.map(acc => (
                <ProjectAccessRow
                  key={acc.id}
                  access={acc}
                  project={projects.find(p => p.id === acc.project_id)}
                  contact={contact}
                  onUpdate={(id, data) => updateAccessMutation.mutate({ id, data })}
                  onRemove={(id) => removeAccessMutation.mutate(id)}
                />
              ))}
            </div>
          )}

          {contact.last_login_at && (
            <p className="text-[10px] text-slate-400 mt-2">
              Último acesso: {new Date(contact.last_login_at).toLocaleString("pt-BR")}
            </p>
          )}
          {contact.invited_at && !contact.activated_at && (
            <div className="flex items-center gap-2 pt-2">
              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-600">Convite enviado em {new Date(contact.invited_at).toLocaleDateString("pt-BR")} — aguardando ativação.</span>
            </div>
          )}
        </div>
      )}

      <ContactFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        contact={contact}
        companies={companies}
        projects={projects}
      />
    </div>
  );
}

export default function ClientAccessManager({ companies, projects }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: contacts = [] } = useQuery({
    queryKey: ["admin_client_contacts"],
    queryFn: () => base44.entities.ClientContact.list()
  });

  const { data: allAccess = [] } = useQuery({
    queryKey: ["admin_project_access"],
    queryFn: () => base44.entities.ProjectClientAccess.list()
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-slate-900">Acessos dos Clientes</h2>
          <p className="text-xs text-slate-500 mt-0.5">{contacts.length} contato(s) cadastrado(s)</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Novo Contato
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Nenhum contato cadastrado.</p>
          <p className="text-slate-400 text-xs mt-1">Crie um contato para dar acesso ao portal do cliente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              companies={companies}
              projects={projects}
              allAccess={allAccess}
            />
          ))}
        </div>
      )}

      <ContactFormDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        companies={companies}
        projects={projects}
      />
    </div>
  );
}