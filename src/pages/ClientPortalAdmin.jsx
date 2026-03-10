import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Building2, Package, CheckCircle2, Clock, Star, AlertCircle,
  Plus, Eye, EyeOff, Globe, ToggleLeft, ToggleRight, Mail, Send,
  Pencil, Trash2, UserCheck, UserX, RefreshCw, X, ChevronDown, ChevronUp, Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

const EMPTY_CONTACT = { name: "", email: "", role: "", phone: "", company_id: "", access_level: "client_user", is_primary: false };
const EMPTY_ACCESS = { client_contact_id: "", project_id: "", company_id: "", can_view: true, can_comment: true, can_approve: false, can_rate: true, can_view_files: true, can_view_calendar: true, is_active: true };

export default function ClientPortalAdmin() {
  const qc = useQueryClient();
  const [contactDialog, setContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [accessDialog, setAccessDialog] = useState(false);
  const [accessForm, setAccessForm] = useState(EMPTY_ACCESS);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(null);

  const { data: projects = [] } = useQuery({ queryKey: ["admin_all_projects"], queryFn: () => base44.entities.Project.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["admin_all_companies"], queryFn: () => base44.entities.Company.list() });
  const { data: deliveries = [] } = useQuery({ queryKey: ["admin_all_deliveries"], queryFn: () => base44.entities.TaskDelivery.list() });
  const { data: contacts = [] } = useQuery({ queryKey: ["admin_client_contacts"], queryFn: () => base44.entities.ClientContact.list() });
  const { data: surveys = [] } = useQuery({ queryKey: ["admin_all_surveys"], queryFn: () => base44.entities.SatisfactionSurvey.list() });
  const { data: meetings = [] } = useQuery({ queryKey: ["admin_all_meetings"], queryFn: () => base44.entities.ProjectMeeting.list() });
  const { data: accesses = [] } = useQuery({ queryKey: ["admin_project_accesses"], queryFn: () => base44.entities.ProjectClientAccess.list() });

  const togglePortal = useMutation({
    mutationFn: ({ project, enabled }) => base44.entities.Project.update(project.id, { client_portal_enabled: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_all_projects"] })
  });

  const saveContact = useMutation({
    mutationFn: (data) => editingContact
      ? base44.entities.ClientContact.update(editingContact.id, data)
      : base44.entities.ClientContact.create({ ...data, invited_at: new Date().toISOString(), status: "active" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_client_contacts"] });
      setContactDialog(false);
      setEditingContact(null);
      setContactForm(EMPTY_CONTACT);
    }
  });

  const toggleContactStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ClientContact.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_client_contacts"] })
  });

  const deleteContact = useMutation({
    mutationFn: (id) => base44.entities.ClientContact.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_client_contacts"] })
  });

  const saveAccess = useMutation({
    mutationFn: (data) => base44.entities.ProjectClientAccess.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_project_accesses"] });
      setAccessDialog(false);
      setAccessForm(EMPTY_ACCESS);
    }
  });

  const toggleAccess = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ProjectClientAccess.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_project_accesses"] })
  });

  const handleInvite = async (contact) => {
    setInviteLoading(contact.id);
    try {
      await base44.users.inviteUser(contact.email, contact.access_level === "client_approver" ? "client_approver" : "client_user");
      await base44.entities.ClientContact.update(contact.id, { invited_at: new Date().toISOString() });
      qc.invalidateQueries({ queryKey: ["admin_client_contacts"] });
    } catch (e) {
      alert("Erro ao convidar: " + e.message);
    }
    setInviteLoading(null);
  };

  const openEditContact = (c) => {
    setEditingContact(c);
    setContactForm({ name: c.name, email: c.email, role: c.role || "", phone: c.phone || "", company_id: c.company_id || "", access_level: c.access_level, is_primary: c.is_primary || false });
    setContactDialog(true);
  };

  const openNewContact = () => {
    setEditingContact(null);
    setContactForm(EMPTY_CONTACT);
    setContactDialog(true);
  };

  // Stats
  const portalProjects = projects.filter(p => p.client_portal_enabled);
  const pendingDeliveries = deliveries.filter(d => ["delivered", "under_review"].includes(d.status));
  const approvedDeliveries = deliveries.filter(d => d.status === "approved");
  const avgSatisfaction = surveys.length > 0 ? (surveys.reduce((s, sv) => s + (sv.overall_score || 0), 0) / surveys.length).toFixed(1) : null;
  const upcomingMeetings = meetings.filter(m => m.status === "scheduled");
  const activeContacts = contacts.filter(c => c.status === "active");

  const stats = [
    { label: "Portais Ativos", value: portalProjects.length, icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Contatos Ativos", value: activeContacts.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Aguard. Aprovação", value: pendingDeliveries.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Aprovadas", value: approvedDeliveries.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Satisfação Média", value: avgSatisfaction ? `${avgSatisfaction}/10` : "—", icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Reuniões Agend.", value: upcomingMeetings.length, icon: Package, color: "text-cyan-600", bg: "bg-cyan-50" },
  ];

  // Group contacts by company
  const contactsByCompany = companies.map(company => ({
    company,
    contacts: contacts.filter(c => c.company_id === company.id)
  })).filter(g => g.contacts.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Central do Cliente</h1>
            <p className="text-slate-500 text-sm mt-1">Gerencie portais, acessos e contatos dos clientes.</p>
          </div>
          <Button onClick={openNewContact} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Novo Contato
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* Projects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Projetos & Portal do Cliente</h2>
          <div className="space-y-3">
            {projects.map(project => {
              const company = companies.find(c => c.id === project.company_id);
              const pendingCount = deliveries.filter(d => d.project_id === project.id && ["delivered", "under_review"].includes(d.status)).length;
              const projectContacts = contacts.filter(c => c.company_id === project.company_id);
              const projectAccesses = accesses.filter(a => a.project_id === project.id);

              return (
                <div key={project.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-all flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                      {company && <span className="text-xs text-slate-400">— {company.name}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <Progress value={project.progress_percentage || 0} className="h-1.5 w-32" />
                      <span className="text-xs text-slate-400">{project.progress_percentage || 0}%</span>
                      <span className="text-xs text-slate-400">{projectContacts.length} contato(s)</span>
                      <span className="text-xs text-slate-400">{projectAccesses.length} acesso(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {pendingCount > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{pendingCount} pendentes</Badge>
                    )}
                    <Badge className={project.client_portal_enabled ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                      {project.client_portal_enabled ? "Portal Ativo" : "Inativo"}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => togglePortal.mutate({ project, enabled: !project.client_portal_enabled })} className="text-slate-400 hover:text-slate-700">
                      {project.client_portal_enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => { setAccessForm({ ...EMPTY_ACCESS, project_id: project.id, company_id: project.company_id || "" }); setAccessDialog(true); }}>
                      <Shield className="w-3 h-3" />
                      Vincular Acesso
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contacts by Company */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Contatos e Acessos ({contacts.length})</h2>
            <Button size="sm" variant="outline" onClick={openNewContact} className="gap-1">
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </Button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum contato cadastrado ainda.</p>
              <p className="text-xs mt-1">Clique em "Novo Contato" para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ungrouped */}
              {contacts.filter(c => !c.company_id).length > 0 && (
                <ContactGroup
                  label="Sem empresa vinculada"
                  contacts={contacts.filter(c => !c.company_id)}
                  accesses={accesses}
                  projects={projects}
                  onEdit={openEditContact}
                  onToggle={(c) => toggleContactStatus.mutate({ id: c.id, status: c.status === "active" ? "inactive" : "active" })}
                  onInvite={handleInvite}
                  onDelete={(c) => { if (confirm("Remover contato?")) deleteContact.mutate(c.id); }}
                  onToggleAccess={(a) => toggleAccess.mutate({ id: a.id, is_active: !a.is_active })}
                  inviteLoading={inviteLoading}
                />
              )}
              {contactsByCompany.map(({ company, contacts: cList }) => (
                <ContactGroup
                  key={company.id}
                  label={company.name}
                  contacts={cList}
                  accesses={accesses}
                  projects={projects}
                  onEdit={openEditContact}
                  onToggle={(c) => toggleContactStatus.mutate({ id: c.id, status: c.status === "active" ? "inactive" : "active" })}
                  onInvite={handleInvite}
                  onDelete={(c) => { if (confirm("Remover contato?")) deleteContact.mutate(c.id); }}
                  onToggleAccess={(a) => toggleAccess.mutate({ id: a.id, is_active: !a.is_active })}
                  inviteLoading={inviteLoading}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={contactDialog} onOpenChange={v => { setContactDialog(v); if (!v) { setEditingContact(null); setContactForm(EMPTY_CONTACT); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Editar Contato" : "Novo Contato Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome *</Label>
                <Input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Email *</Label>
                <Input value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Cargo</Label>
                <Input value={contactForm.role} onChange={e => setContactForm(f => ({ ...f, role: e.target.value }))} placeholder="Diretor, Gerente..." className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Empresa</Label>
              <Select value={contactForm.company_id} onValueChange={v => setContactForm(f => ({ ...f, company_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Nível de Acesso</Label>
              <Select value={contactForm.access_level} onValueChange={v => setContactForm(f => ({ ...f, access_level: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_user">Visualizador — pode ver e comentar</SelectItem>
                  <SelectItem value="client_approver">Aprovador — pode aprovar entregas e avaliar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" id="is_primary" checked={contactForm.is_primary} onChange={e => setContactForm(f => ({ ...f, is_primary: e.target.checked }))} className="rounded" />
              <Label htmlFor="is_primary" className="text-xs cursor-pointer">Contato principal da empresa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => saveContact.mutate(contactForm)}
              disabled={!contactForm.name || !contactForm.email || saveContact.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saveContact.isPending ? "Salvando..." : editingContact ? "Salvar Alterações" : "Criar Contato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Dialog */}
      <Dialog open={accessDialog} onOpenChange={v => { setAccessDialog(v); if (!v) setAccessForm(EMPTY_ACCESS); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Acesso ao Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Contato *</Label>
              <Select value={accessForm.client_contact_id} onValueChange={v => setAccessForm(f => ({ ...f, client_contact_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o contato" /></SelectTrigger>
                <SelectContent>
                  {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Projeto *</Label>
              <Select value={accessForm.project_id} onValueChange={v => { const p = projects.find(p => p.id === v); setAccessForm(f => ({ ...f, project_id: v, company_id: p?.company_id || f.company_id })); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                <SelectContent>
                  {projects.filter(p => p.client_portal_enabled).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { key: "can_comment", label: "Pode comentar" },
                { key: "can_approve", label: "Pode aprovar" },
                { key: "can_rate", label: "Pode avaliar" },
                { key: "can_view_files", label: "Ver arquivos" },
                { key: "can_view_calendar", label: "Ver calendário" },
                { key: "is_active", label: "Acesso ativo" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={accessForm[key]} onChange={e => setAccessForm(f => ({ ...f, [key]: e.target.checked }))} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccessDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => saveAccess.mutate(accessForm)}
              disabled={!accessForm.client_contact_id || !accessForm.project_id || saveAccess.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saveAccess.isPending ? "Salvando..." : "Vincular Acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactGroup({ label, contacts, accesses, projects, onEdit, onToggle, onInvite, onDelete, onToggleAccess, inviteLoading }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          <span className="text-xs text-slate-400">({contacts.length})</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="divide-y divide-slate-50">
          {contacts.map(c => {
            const contactAccesses = accesses.filter(a => a.client_contact_id === c.id);
            return (
              <div key={c.id} className="px-4 py-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                    {c.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-900">{c.name}</p>
                      {c.is_primary && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Principal</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{c.email}{c.role ? ` · ${c.role}` : ""}</p>
                    {c.invited_at && <p className="text-[10px] text-slate-400 mt-0.5">Convidado em {format(new Date(c.invited_at), "dd/MM/yyyy")}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                    <Badge className={c.access_level === "client_approver" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                      {c.access_level === "client_approver" ? "Aprovador" : "Visualizador"}
                    </Badge>
                    <Badge className={c.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
                      {c.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" onClick={() => onEdit(c)} title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className={`h-7 w-7 p-0 ${c.status === "active" ? "text-slate-400 hover:text-rose-500" : "text-slate-400 hover:text-emerald-500"}`}
                      onClick={() => onToggle(c)}
                      title={c.status === "active" ? "Desativar acesso" : "Reativar acesso"}
                    >
                      {c.status === "active" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-xs gap-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => onInvite(c)}
                      disabled={inviteLoading === c.id}
                      title="Enviar convite"
                    >
                      {inviteLoading === c.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Convidar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-300 hover:text-rose-500" onClick={() => onDelete(c)} title="Remover">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Project accesses */}
                {contactAccesses.length > 0 && (
                  <div className="ml-12 mt-2 space-y-1">
                    {contactAccesses.map(a => {
                      const proj = projects.find(p => p.id === a.project_id);
                      return (
                        <div key={a.id} className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                          <Package className="w-3 h-3 text-slate-400" />
                          <span className="font-medium text-slate-700">{proj?.name || a.project_id}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            {a.can_approve && <span className="text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">Aprova</span>}
                            {a.can_comment && <span className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">Comenta</span>}
                            <button
                              onClick={() => onToggleAccess(a)}
                              className={`ml-1 text-[10px] px-1.5 py-0.5 rounded ${a.is_active !== false ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-500"}`}
                            >
                              {a.is_active !== false ? "Ativo" : "Inativo"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}