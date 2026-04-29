/**
 * ClientProjectSettings — Painel completo de gestão do portal por empresa.
 * Permite ao gestor configurar TUDO para o cliente de forma centralizada:
 * projetos, portais, tarefas, reuniões, marcos, onboarding, arquivos, finanças e cursos.
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, Globe, Eye, EyeOff, Users, Clock, Star,
  CheckCircle2, AlertCircle, Settings, ChevronRight, Plus, Edit2,
  TrendingUp, Shield, Send, ExternalLink, Zap, MessageSquare,
  FileText, BarChart3, Package
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortalContentManager from "./PortalContentManager";

// ─── Mini card de projeto ──────────────────────────────────────────────────────
function ProjectPortalCard({ project, contacts, allAccess, onManage, onTogglePortal }) {
  const projectContacts = contacts.filter(c =>
    allAccess.some(a => a.project_id === project.id && a.client_contact_id === c.id)
  );

  const colorMap = {
    blue: "bg-blue-500", purple: "bg-purple-500", green: "bg-green-500",
    orange: "bg-orange-500", pink: "bg-pink-500", red: "bg-red-500",
    indigo: "bg-indigo-500", teal: "bg-teal-500"
  };
  const dotColor = colorMap[project.color] || "bg-blue-500";

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${project.client_portal_enabled ? "border-emerald-200" : "border-slate-200"}`}>
      {/* Top stripe */}
      <div className={`h-1.5 w-full ${project.client_portal_enabled ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-slate-200"}`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dotColor}`} />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{project.name}</p>
              {project.current_phase && (
                <p className="text-xs text-slate-400 truncate">{project.current_phase}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
              project.status === "active" ? "bg-blue-100 text-blue-700" :
              project.status === "completed" ? "bg-emerald-100 text-emerald-700" :
              "bg-slate-100 text-slate-500"
            }`}>
              {project.status === "active" ? "Ativo" : project.status === "completed" ? "Concluído" : "Arquivado"}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Progresso geral</span>
            <span className="text-xs font-semibold text-slate-700">{project.progress_percentage || 0}%</span>
          </div>
          <Progress value={project.progress_percentage || 0} className="h-2" />
        </div>

        {/* Dates */}
        {(project.project_start_date || project.estimated_end_date) && (
          <div className="flex gap-4 text-xs text-slate-500">
            {project.project_start_date && (
              <span>Início: {new Date(project.project_start_date).toLocaleDateString("pt-BR")}</span>
            )}
            {project.estimated_end_date && (
              <span>Entrega: {new Date(project.estimated_end_date).toLocaleDateString("pt-BR")}</span>
            )}
          </div>
        )}

        {/* Client access summary */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">
              {projectContacts.length} acesso{projectContacts.length !== 1 ? "s" : ""} de cliente
            </span>
          </div>
          {projectContacts.length > 0 && (
            <div className="flex -space-x-1">
              {projectContacts.slice(0, 3).map(c => (
                <div key={c.id} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-blue-700">
                  {c.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              ))}
              {projectContacts.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500">
                  +{projectContacts.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portal toggle + manage btn */}
        <div className="flex items-center gap-2 pt-1">
          <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border transition-colors ${
            project.client_portal_enabled ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
          }`}>
            <Switch
              checked={!!project.client_portal_enabled}
              onCheckedChange={v => onTogglePortal(project, v)}
              className="scale-90"
            />
            <span className={`text-xs font-medium ${project.client_portal_enabled ? "text-emerald-700" : "text-slate-500"}`}>
              {project.client_portal_enabled ? "Portal ativo" : "Portal inativo"}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => onManage(project)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs flex-shrink-0 h-9"
          >
            <Settings className="w-3.5 h-3.5" />
            Gerir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Gestão detalhada de um projeto ──────────────────────────────────────────
function ProjectDetailPanel({ project, company, contacts, allAccess, onClose }) {
  const projectContacts = contacts.filter(c =>
    allAccess.some(a => a.project_id === project.id && a.client_contact_id === c.id && a.is_active)
  );

  return (
    <div className="space-y-4">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-slate-500 hover:text-slate-800 -ml-1">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          <p className="font-semibold text-slate-900 truncate">{project.name}</p>
          <Badge className={project.client_portal_enabled ? "bg-emerald-100 text-emerald-700 text-[10px]" : "bg-slate-100 text-slate-500 text-[10px]"}>
            {project.client_portal_enabled ? "Portal Ativo" : "Portal Inativo"}
          </Badge>
        </div>
      </div>

      {/* Clientes com acesso */}
      {projectContacts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Clientes com acesso a este projeto
          </p>
          <div className="flex flex-wrap gap-2">
            {projectContacts.map(c => (
              <span key={c.id} className="flex items-center gap-1.5 text-xs bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                  {c.name?.charAt(0)?.toUpperCase()}
                </span>
                {c.name}
                <span className={`text-[9px] px-1 py-0.5 rounded ${c.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                  {c.status === "active" ? "ativo" : c.status}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* PortalContentManager for each client */}
      {projectContacts.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum cliente com acesso a este projeto.</p>
          <p className="text-xs text-slate-400 mt-1">Adicione clientes na aba "Contatos & Acessos".</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projectContacts.map(contact => (
            <div key={contact.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {contact.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{contact.name}</p>
                  <p className="text-xs text-slate-400">{contact.email} · {contact.role || "—"}</p>
                </div>
              </div>
              <PortalContentManager
                contact={contact}
                projects={[project]}
                companies={[company]}
                defaultProjectId={project.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ClientProjectSettings({
  company, projects, contacts, allAccess, deliveries, surveys, meetings, onBack
}) {
  const qc = useQueryClient();
  const [managingProject, setManagingProject] = useState(null);

  const companyProjects = projects.filter(p => p.company_id === company?.id);
  const companyContacts = contacts.filter(c => c.company_id === company?.id);
  const activeContacts = companyContacts.filter(c => c.status === "active");

  const companyDeliveries = deliveries.filter(d => companyProjects.some(p => p.id === d.project_id));
  const pendingDeliveries = companyDeliveries.filter(d => ["delivered", "under_review"].includes(d.status));
  const approvedDeliveries = companyDeliveries.filter(d => d.status === "approved");

  const companySurveys = surveys.filter(s => companyProjects.some(p => p.id === s.project_id));
  const avgScore = companySurveys.length > 0
    ? (companySurveys.reduce((s, sv) => s + (sv.overall_score || 0), 0) / companySurveys.length).toFixed(1)
    : null;

  const companyMeetings = meetings.filter(m => companyProjects.some(p => p.id === m.project_id));
  const upcomingMeetings = companyMeetings.filter(m => m.status === "scheduled");

  const togglePortalMutation = useMutation({
    mutationFn: ({ project, enabled }) =>
      base44.entities.Project.update(project.id, { client_portal_enabled: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_all_projects"] })
  });

  // Detail view: managing a specific project
  if (managingProject) {
    const proj = projects.find(p => p.id === managingProject);
    if (proj) {
      return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          <ProjectDetailPanel
            project={proj}
            company={company}
            contacts={companyContacts}
            allAccess={allAccess}
            onClose={() => setManagingProject(null)}
          />
        </div>
      );
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-slate-500 hover:text-slate-800 -ml-1">
        <ArrowLeft className="w-4 h-4" />
        Todas as empresas
      </Button>

      {/* Company header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
        <div className="flex items-start gap-4 flex-wrap">
          {company?.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-100 flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {company?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{company?.name}</h1>
            <p className="text-sm text-slate-400">{company?.segment || "—"}</p>
            {company?.email && <p className="text-xs text-slate-400 mt-0.5">{company.email}</p>}
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Projetos", value: companyProjects.length, color: "text-slate-700", bg: "bg-slate-50" },
              { label: "Clientes ativos", value: activeContacts.length, color: "text-emerald-700", bg: "bg-emerald-50" },
              { label: "Pendências", value: pendingDeliveries.length, color: "text-amber-700", bg: "bg-amber-50" },
              ...(avgScore ? [{ label: "Satisfação", value: `${avgScore}/10`, color: "text-purple-700", bg: "bg-purple-50" }] : []),
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl px-3 py-2 text-center min-w-[72px]`}>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl mb-4 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="projects" className="gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm">
            <Package className="w-4 h-4" />
            Projetos & Portais
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm relative">
            <Users className="w-4 h-4" />
            Clientes
            {companyContacts.length > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                {companyContacts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="gap-2 rounded-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white text-sm relative">
            <CheckCircle2 className="w-4 h-4" />
            Entregas
            {pendingDeliveries.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingDeliveries.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm">
            <Clock className="w-4 h-4" />
            Reuniões
          </TabsTrigger>
          {avgScore && (
            <TabsTrigger value="surveys" className="gap-2 rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white text-sm">
              <Star className="w-4 h-4" />
              Avaliações
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Projetos */}
        <TabsContent value="projects">
          {companyProjects.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nenhum projeto vinculado a esta empresa.</p>
              <p className="text-slate-400 text-xs mt-1">Crie um projeto no módulo de projetos e vincule esta empresa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {companyProjects.map(project => (
                <ProjectPortalCard
                  key={project.id}
                  project={project}
                  contacts={companyContacts}
                  allAccess={allAccess}
                  onManage={p => setManagingProject(p.id)}
                  onTogglePortal={(project, enabled) => togglePortalMutation.mutate({ project, enabled })}
                />
              ))}
            </div>
          )}

          {companyProjects.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
              <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Clique em <strong>Gerir</strong> para configurar tarefas visíveis, reuniões, marcos da timeline, onboarding, arquivos e muito mais para cada cliente deste projeto.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Tab: Clientes */}
        <TabsContent value="contacts">
          {companyContacts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nenhum cliente cadastrado para esta empresa.</p>
              <p className="text-slate-400 text-xs mt-1">Acesse "Contatos & Acessos" para adicionar clientes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companyContacts.map(contact => {
                const contactAccess = allAccess.filter(a => a.client_contact_id === contact.id);
                const accessedProjects = companyProjects.filter(p => contactAccess.some(a => a.project_id === p.id));

                return (
                  <div key={contact.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {contact.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{contact.name}</p>
                          <Badge className={
                            contact.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]" :
                            contact.status === "invite_sent" ? "bg-amber-100 text-amber-700 border-amber-200 text-[10px]" :
                            "bg-slate-100 text-slate-500 border-slate-200 text-[10px]"
                          }>
                            {contact.status === "active" ? "Ativo" :
                             contact.status === "invite_sent" ? "Aguardando" :
                             contact.status === "disabled" ? "Desativado" : "Rascunho"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">{contact.email}</p>
                        {contact.role && <p className="text-xs text-slate-400">{contact.role}</p>}

                        {accessedProjects.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {accessedProjects.map(p => {
                              const acc = contactAccess.find(a => a.project_id === p.id);
                              return (
                                <span key={p.id} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                                  acc?.is_active ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-slate-50 text-slate-400 border-slate-200 line-through"
                                }`}>
                                  {p.name}
                                  {acc?.can_approve && " · aprovador"}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {contact.last_login_at && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-slate-400">Último acesso</p>
                          <p className="text-xs text-slate-600 font-medium">
                            {new Date(contact.last_login_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Entregas */}
        <TabsContent value="deliveries">
          {companyDeliveries.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nenhuma entrega registrada para esta empresa.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companyDeliveries.map(d => {
                const proj = companyProjects.find(p => p.id === d.project_id);
                const statusMap = {
                  draft: { label: "Rascunho", color: "bg-slate-100 text-slate-500" },
                  delivered: { label: "Aguardando revisão", color: "bg-amber-100 text-amber-700" },
                  under_review: { label: "Em revisão", color: "bg-blue-100 text-blue-700" },
                  approved: { label: "Aprovada", color: "bg-emerald-100 text-emerald-700" },
                  changes_requested: { label: "Revisão solicitada", color: "bg-rose-100 text-rose-700" },
                };
                const sc = statusMap[d.status] || statusMap.draft;

                return (
                  <div key={d.id} className={`bg-white border rounded-xl p-4 ${
                    ["delivered", "under_review"].includes(d.status) ? "border-amber-200" :
                    d.status === "approved" ? "border-emerald-200" :
                    d.status === "changes_requested" ? "border-rose-200" :
                    "border-slate-200"
                  }`}>
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{d.title}</p>
                        {proj && <p className="text-xs text-slate-400">{proj.name}</p>}
                        {d.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.description}</p>}
                        {d.delivered_at && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Entregue em {new Date(d.delivered_at).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <Badge className={`${sc.color} text-[10px] flex-shrink-0`}>{sc.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Reuniões */}
        <TabsContent value="meetings">
          {companyMeetings.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nenhuma reunião registrada para esta empresa.</p>
              <p className="text-slate-400 text-xs mt-1">Adicione reuniões dentro de cada projeto (clique em "Gerir").</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...companyMeetings]
                .sort((a, b) => new Date(b.start_datetime || 0) - new Date(a.start_datetime || 0))
                .map(m => {
                  const proj = companyProjects.find(p => p.id === m.project_id);
                  const statusMap = {
                    scheduled: { label: "Agendada", color: "bg-blue-100 text-blue-700" },
                    completed: { label: "Realizada", color: "bg-emerald-100 text-emerald-700" },
                    cancelled: { label: "Cancelada", color: "bg-slate-100 text-slate-500" },
                  };
                  const sc = statusMap[m.status] || statusMap.scheduled;

                  return (
                    <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-start gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{m.title}</p>
                          {proj && <p className="text-xs text-slate-400">{proj.name}</p>}
                          {m.start_datetime && (
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(m.start_datetime).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                            </p>
                          )}
                          {m.meeting_link && (
                            <a href={m.meeting_link} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                              <ExternalLink className="w-3 h-3" /> Link da reunião
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <Badge className={`${sc.color} text-[10px]`}>{sc.label}</Badge>
                          <Badge className={`text-[10px] ${m.visible_to_client ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                            {m.visible_to_client ? "Visível ao cliente" : "Oculta"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Avaliações */}
        <TabsContent value="surveys">
          {companySurveys.length === 0 ? (
            <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
              <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nenhuma avaliação recebida desta empresa.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-purple-200 rounded-2xl p-5 flex items-center gap-4">
                <Star className="w-8 h-8 text-amber-400 fill-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-3xl font-bold text-slate-900">{avgScore}<span className="text-lg text-slate-400">/10</span></p>
                  <p className="text-sm text-slate-500">{companySurveys.length} avaliação{companySurveys.length > 1 ? "ões" : ""} recebida{companySurveys.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              {[...companySurveys]
                .sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0))
                .map(s => {
                  const proj = companyProjects.find(p => p.id === s.project_id);
                  return (
                    <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xl font-bold text-amber-500">{s.overall_score}/10</span>
                          {proj && <span className="ml-2 text-xs text-slate-400">{proj.name}</span>}
                        </div>
                        <span className="text-xs text-slate-400">
                          {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </div>
                      {s.comment && <p className="text-sm text-slate-600 mt-2">{s.comment}</p>}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {[
                          { label: "Comunicação", value: s.communication_score },
                          { label: "Prazos", value: s.timeline_score },
                          { label: "Qualidade", value: s.quality_score },
                          { label: "Resultados", value: s.result_score },
                        ].filter(x => x.value).map(x => (
                          <div key={x.label} className="bg-slate-50 rounded-lg p-2 text-center">
                            <p className="text-sm font-bold text-slate-700">{x.value}/10</p>
                            <p className="text-[10px] text-slate-400">{x.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}