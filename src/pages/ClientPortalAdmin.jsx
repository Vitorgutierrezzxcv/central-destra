import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Building2, Package, CheckCircle2, Clock, Star, AlertCircle, Plus, Eye, EyeOff, Globe, GlobeLock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ClientPortalAdmin() {
  const qc = useQueryClient();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", role: "", phone: "", company_id: "", access_level: "client_user" });

  const { data: projects = [] } = useQuery({
    queryKey: ["admin_all_projects"],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["admin_all_companies"],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ["admin_all_deliveries"],
    queryFn: () => base44.entities.TaskDelivery.list()
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["admin_client_contacts"],
    queryFn: () => base44.entities.ClientContact.list()
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ["admin_all_surveys"],
    queryFn: () => base44.entities.SatisfactionSurvey.list()
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["admin_all_meetings"],
    queryFn: () => base44.entities.ProjectMeeting.list()
  });

  const togglePortalMutation = useMutation({
    mutationFn: ({ project, enabled }) => base44.entities.Project.update(project.id, { client_portal_enabled: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_all_projects"] })
  });

  const createContactMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientContact.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_client_contacts"] });
      setShowContactDialog(false);
    }
  });

  const portalProjects = projects.filter(p => p.client_portal_enabled);
  const pendingDeliveries = deliveries.filter(d => ["delivered", "under_review"].includes(d.status));
  const approvedDeliveries = deliveries.filter(d => d.status === "approved");
  const changesDeliveries = deliveries.filter(d => d.status === "changes_requested");
  const avgSatisfaction = surveys.length > 0
    ? (surveys.reduce((s, sv) => s + (sv.overall_score || 0), 0) / surveys.length).toFixed(1)
    : null;
  const upcomingMeetings = meetings.filter(m => m.status === "scheduled");

  const stats = [
    { label: "Portais Ativos", value: portalProjects.length, icon: Globe, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Aguardando Aprovação", value: pendingDeliveries.length, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Entregas Aprovadas", value: approvedDeliveries.length, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Ajustes Solicitados", value: changesDeliveries.length, icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-400/10" },
    { label: "Satisfação Média", value: avgSatisfaction ? `${avgSatisfaction}/10` : "—", icon: Star, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Reuniões Agendadas", value: upcomingMeetings.length, icon: Users, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Central do Cliente</h1>
            <p className="text-slate-500 text-sm mt-1">Gerencie portais, contatos e entregas dos clientes.</p>
          </div>
          <Button onClick={() => setShowContactDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Novo Contato
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Projects with Portal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Projetos & Status do Portal</h2>
          <div className="space-y-3">
            {projects.map(project => {
              const company = companies.find(c => c.id === project.company_id);
              const projectDeliveries = deliveries.filter(d => d.project_id === project.id);
              const pendingCount = projectDeliveries.filter(d => ["delivered", "under_review"].includes(d.status)).length;

              return (
                <div key={project.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                    {company && <p className="text-xs text-slate-500">{company.name}</p>}
                    <Progress value={project.progress_percentage || 0} className="h-1.5 mt-2 max-w-xs" />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pendingCount > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{pendingCount} pendentes</Badge>
                    )}
                    <Badge className={project.client_portal_enabled ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                      {project.client_portal_enabled ? "Portal Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePortalMutation.mutate({ project, enabled: !project.client_portal_enabled })}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {project.client_portal_enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client Contacts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Contatos dos Clientes ({contacts.length})</h2>
          {contacts.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Nenhum contato cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 pb-2">Nome</th>
                    <th className="text-left text-xs font-semibold text-slate-500 pb-2">Email</th>
                    <th className="text-left text-xs font-semibold text-slate-500 pb-2">Cargo</th>
                    <th className="text-left text-xs font-semibold text-slate-500 pb-2">Acesso</th>
                    <th className="text-left text-xs font-semibold text-slate-500 pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {contacts.map(c => (
                    <tr key={c.id}>
                      <td className="py-3 font-medium text-slate-900">{c.name}</td>
                      <td className="py-3 text-slate-500">{c.email}</td>
                      <td className="py-3 text-slate-500">{c.role || "—"}</td>
                      <td className="py-3">
                        <Badge className={c.access_level === "client_approver"
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"}>
                          {c.access_level === "client_approver" ? "Aprovador" : "Visualizador"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge className={c.status === "active"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"}>
                          {c.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Contato Cliente</DialogTitle>
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
                  <SelectItem value="client_user">Visualizador</SelectItem>
                  <SelectItem value="client_approver">Aprovador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => createContactMutation.mutate(contactForm)}
              disabled={!contactForm.name || !contactForm.email || createContactMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createContactMutation.isPending ? "Salvando..." : "Criar Contato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}