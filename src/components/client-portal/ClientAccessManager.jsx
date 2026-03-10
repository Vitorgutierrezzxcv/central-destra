import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const callFn = (name, payload) => base44.functions.invoke(name, payload);
import {
  Plus, Trash2, UserCheck, UserX, Shield, RefreshCw,
  ChevronDown, ChevronUp, Edit2, Send, Copy, CheckCheck,
  Clock, CheckCircle2, AlertTriangle, XCircle, Ban
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

// ---- Status Config ----
const statusConfig = {
  draft:       { label: "Rascunho",   color: "bg-slate-100 text-slate-600 border-slate-200", icon: Edit2 },
  invite_sent: { label: "Aguardando", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  active:      { label: "Ativo",      color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  disabled:    { label: "Desativado", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  pending_invite: { label: "Pendente", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock }
};

// ---- Formulário de criação/edição ----
function ContactFormDialog({ open, onClose, contact, companies, projects }) {
  const qc = useQueryClient();
  const isEdit = !!contact?.id;
  const [form, setForm] = useState(contact || {
    name: "", email: "", role: "", phone: "", company_id: "", access_level: "client_user", status: "draft"
  });
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [error, setError] = useState("");

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      setError("");
      if (isEdit) {
        return base44.entities.ClientContact.update(contact.id, data);
      }
      const saved = await base44.entities.ClientContact.create({
        ...data, status: "draft"
      });
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
    onError: (err) => setError(err?.message || "Erro ao salvar contato.")
  });

  // Mostrar todos os projetos da empresa (sem filtrar por client_portal_enabled)
  const companyProjects = projects.filter(p => p.company_id === form.company_id);

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
                <SelectItem value="client_approver">Aprovador — pode aprovar e avaliar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isEdit && form.company_id && companyProjects.length > 0 && (
            <div>
              <Label className="text-xs">Projetos Liberados</Label>
              <div className="mt-1 space-y-2">
                {companyProjects.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={selectedProjects.includes(p.id)} onChange={() =>
                      setSelectedProjects(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])
                    } className="rounded" />
                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                  </label>
                ))}
                {companyProjects.length === 0 && (
                  <p className="text-xs text-slate-400 py-2">Nenhum projeto com portal ativo nesta empresa.</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={!form.name || !form.email || !form.company_id || saveMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saveMutation.isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar Contato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Card de contato ----
function ContactCard({ contact, companies, projects, allAccess, invites }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const [sendError, setSendError] = useState("");

  const company = companies.find(c => c.id === contact.company_id);
  const contactAccess = allAccess.filter(a => a.client_contact_id === contact.id);
  const companyProjects = projects.filter(p => p.company_id === contact.company_id);
  const accessedIds = contactAccess.map(a => a.project_id);
  const availableProjects = companyProjects.filter(p => !accessedIds.includes(p.id));
  const lastInvite = invites
    .filter(i => i.client_contact_id === contact.id)
    .sort((a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0))[0];

  const contactInvites = invites
    .filter(i => i.client_contact_id === contact.id)
    .sort((a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0));

  const handleSendInvite = async () => {
    if (contactAccess.length === 0) {
      setSendError("Vincule pelo menos 1 projeto antes de enviar o convite.");
      return;
    }
    setSending(true);
    setSendError("");
    try {
      const res = await callFn("sendClientInvite", { client_contact_id: contact.id });
      const data = res?.data || res;
      if (data?.success) {
        const link = `${window.location.origin}/ClientPortalActivate?token=${data.token}`;
        setInviteLink(link);
        qc.invalidateQueries({ queryKey: ["admin_client_contacts"] });
        qc.invalidateQueries({ queryKey: ["admin_invites"] });
      } else {
        setSendError(data?.error || "Erro ao enviar o convite.");
      }
    } catch (e) {
      setSendError(e?.message || "Não foi possível enviar o convite. Verifique a configuração do serviço.");
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    try {
      await callFn("cancelClientInvite", { invite_id: inviteId });
      qc.invalidateQueries({ queryKey: ["admin_invites"] });
      qc.invalidateQueries({ queryKey: ["admin_client_contacts"] });
    } catch (e) {
      setSendError("Erro ao cancelar convite.");
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    try {
      await callFn("deleteClientInvite", { invite_id: inviteId });
      qc.invalidateQueries({ queryKey: ["admin_invites"] });
    } catch (e) {
      setSendError("Erro ao apagar convite.");
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleStatus = useMutation({
    mutationFn: () => base44.entities.ClientContact.update(contact.id, {
      status: contact.status === "active" ? "disabled" : "active"
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_client_contacts"] })
  });

  const addProjectMutation = useMutation({
    mutationFn: (pid) => base44.entities.ProjectClientAccess.create({
      project_id: pid, company_id: contact.company_id, client_contact_id: contact.id,
      can_view: true, can_comment: true, can_approve: contact.access_level === "client_approver",
      can_rate: true, can_view_files: true, can_view_calendar: true, is_active: true
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_project_access"] })
  });

  const removeAccessMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectClientAccess.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_project_access"] })
  });

  const sc = statusConfig[contact.status] || statusConfig.draft;
  const StatusIcon = sc.icon;

  const canSendInvite = contact.status !== "active" && contact.status !== "disabled";
  const canResend = contact.status === "invite_sent" || contact.status === "active";

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      {/* Header row */}
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
          {contact.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
          <p className="text-xs text-slate-500">{contact.email}</p>
          {company && <p className="text-xs text-slate-400">{company.name}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`${sc.color} flex items-center gap-1 text-xs`}>
            <StatusIcon className="w-3 h-3" />
            {sc.label}
          </Badge>
          <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setEditOpen(true); }} className="text-slate-400 hover:text-slate-700 h-8 w-8 p-0">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); toggleStatus.mutate(); }}
            className={contact.status === "active" ? "text-rose-400 hover:text-rose-600 h-8 w-8 p-0" : "text-emerald-600 hover:text-emerald-700 h-8 w-8 p-0"}
          >
            {contact.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </Button>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4">
          {/* Convite */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Status do Convite
            </p>

            {lastInvite && (
              <div className="text-xs text-slate-500 space-y-0.5">
                {lastInvite.sent_at && <p>Enviado em: <strong>{new Date(lastInvite.sent_at).toLocaleString("pt-BR")}</strong></p>}
                {lastInvite.expires_at && <p>Expira em: <strong>{new Date(lastInvite.expires_at).toLocaleDateString("pt-BR")}</strong></p>}
                {lastInvite.accepted_at && <p className="text-emerald-600">Aceito em: <strong>{new Date(lastInvite.accepted_at).toLocaleString("pt-BR")}</strong></p>}
              </div>
            )}

            {sendError && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5" /> {sendError}
              </div>
            )}

            {inviteLink ? (
              <div className="space-y-2">
                <p className="text-xs text-emerald-600 font-medium">✓ Convite enviado com sucesso!</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 truncate font-mono">
                    {inviteLink}
                  </div>
                  <Button size="sm" onClick={handleCopyLink} className={`flex-shrink-0 text-xs gap-1 ${copied ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-700 hover:bg-slate-800"} text-white`}>
                    {copied ? <><CheckCheck className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleSendInvite}
                disabled={sending}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs"
              >
                {sending ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                ) : canResend ? (
                  <><RefreshCw className="w-3.5 h-3.5" /> Reenviar Convite</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Enviar Convite</>
                )}
              </Button>
            )}
          </div>

          {/* Projetos liberados */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Projetos Liberados</p>
              {availableProjects.length > 0 && (
                <Select onValueChange={pid => addProjectMutation.mutate(pid)}>
                  <SelectTrigger className="h-7 text-xs w-auto gap-1 border-blue-200 text-blue-600 hover:bg-blue-50">
                    <Plus className="w-3 h-3" /> Adicionar
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            {contactAccess.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">Nenhum projeto liberado.</p>
            ) : (
              <div className="space-y-2">
                {contactAccess.map(acc => {
                  const proj = projects.find(p => p.id === acc.project_id);
                  return (
                    <div key={acc.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{proj?.name || acc.project_id}</p>
                        <div className="flex gap-1 mt-1">
                          {acc.can_comment && <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Comentar</Badge>}
                          {acc.can_approve && <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">Aprovar</Badge>}
                          {acc.can_rate && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Avaliar</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={!!acc.is_active} onCheckedChange={v => base44.entities.ProjectClientAccess.update(acc.id, { is_active: v }).then(() => qc.invalidateQueries({ queryKey: ["admin_project_access"] }))} className="scale-75" />
                        <Button size="sm" variant="ghost" onClick={() => removeAccessMutation.mutate(acc.id)} className="text-rose-400 hover:text-rose-600 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {contact.activated_at && (
            <p className="text-[10px] text-slate-400">
              Ativado em: {new Date(contact.activated_at).toLocaleString("pt-BR")}
            </p>
          )}
          {contact.last_login_at && (
            <p className="text-[10px] text-slate-400">
              Último acesso: {new Date(contact.last_login_at).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}

      <ContactFormDialog open={editOpen} onClose={() => setEditOpen(false)} contact={contact} companies={companies} projects={projects} />
    </div>
  );
}

// ---- Main ----
export default function ClientAccessManager({ companies, projects }) {
  const [showCreate, setShowCreate] = useState(false);

  const { data: contacts = [] } = useQuery({
    queryKey: ["admin_client_contacts"],
    queryFn: () => base44.entities.ClientContact.list()
  });

  const { data: allAccess = [] } = useQuery({
    queryKey: ["admin_project_access"],
    queryFn: () => base44.entities.ProjectClientAccess.list()
  });

  const { data: invites = [] } = useQuery({
    queryKey: ["admin_invites"],
    queryFn: () => base44.entities.ClientInvite.list("-sent_at", 200)
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-slate-900">Acessos dos Clientes</h2>
          <p className="text-xs text-slate-500 mt-0.5">{contacts.length} contato(s) cadastrado(s)</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm">
          <Plus className="w-4 h-4" /> Novo Contato
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
            <ContactCard key={contact.id} contact={contact} companies={companies} projects={projects} allAccess={allAccess} invites={invites} />
          ))}
        </div>
      )}

      <ContactFormDialog open={showCreate} onClose={() => setShowCreate(false)} companies={companies} projects={projects} />
    </div>
  );
}