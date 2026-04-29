import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Building2, CheckCircle2, Clock, Star, AlertCircle, Globe,
  Eye, EyeOff, Settings, UserCog, UserPlus, Link2, Bell, ChevronRight,
  Search, Filter, ArrowLeft, Plus, TrendingUp, Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientAccessManager from "@/components/client-portal/ClientAccessManager";
import ClientProjectSettings from "@/components/client-portal/ClientProjectSettings";

export default function ClientPortalAdmin() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [view, setView] = useState("companies"); // "companies" | "company_detail"

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

  const { data: surveys = [] } = useQuery({
    queryKey: ["admin_all_surveys"],
    queryFn: () => base44.entities.SatisfactionSurvey.list()
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["admin_all_meetings"],
    queryFn: () => base44.entities.ProjectMeeting.list()
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["admin_all_user_profiles"],
    queryFn: () => base44.entities.UserProfile.filter({ portal_type: "client" })
  });

  const { data: allAccess = [] } = useQuery({
    queryKey: ["admin_all_access"],
    queryFn: () => base44.entities.ProjectClientAccess.list()
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["admin_client_contacts"],
    queryFn: () => base44.entities.ClientContact.list()
  });

  const unlinkedClients = allProfiles.filter(profile =>
    !allAccess.some(a => a.user_email === profile.user_email)
  );

  const togglePortalMutation = useMutation({
    mutationFn: ({ project, enabled }) =>
      base44.entities.Project.update(project.id, { client_portal_enabled: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_all_projects"] })
  });

  // Enrich companies with stats
  const enrichedCompanies = companies.map(company => {
    const companyProjects = projects.filter(p => p.company_id === company.id);
    const activeProjects = companyProjects.filter(p => p.status === "active");
    const portalProjects = companyProjects.filter(p => p.client_portal_enabled);
    const companyContacts = contacts.filter(c => c.company_id === company.id);
    const activeContacts = companyContacts.filter(c => c.status === "active");
    const companyDeliveries = deliveries.filter(d => companyProjects.some(p => p.id === d.project_id));
    const pendingDeliveries = companyDeliveries.filter(d => ["delivered", "under_review"].includes(d.status));
    const companySurveys = surveys.filter(s => companyProjects.some(p => p.id === s.project_id));
    const avgScore = companySurveys.length > 0
      ? (companySurveys.reduce((s, sv) => s + (sv.overall_score || 0), 0) / companySurveys.length).toFixed(1)
      : null;
    return {
      ...company,
      companyProjects,
      activeProjects,
      portalProjects,
      companyContacts,
      activeContacts,
      pendingDeliveries,
      avgScore,
    };
  });

  const filteredCompanies = enrichedCompanies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.segment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPortalProjects = projects.filter(p => p.client_portal_enabled).length;
  const pendingDeliveriesTotal = deliveries.filter(d => ["delivered", "under_review"].includes(d.status)).length;
  const approvedTotal = deliveries.filter(d => d.status === "approved").length;
  const avgSatisfaction = surveys.length > 0
    ? (surveys.reduce((s, sv) => s + (sv.overall_score || 0), 0) / surveys.length).toFixed(1)
    : null;

  const stats = [
    { label: "Portais Ativos", value: totalPortalProjects, icon: Globe, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Clientes Ativos", value: contacts.filter(c => c.status === "active").length, icon: Users, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Aguard. Aprovação", value: pendingDeliveriesTotal, icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Entregas Aprovadas", value: approvedTotal, icon: CheckCircle2, color: "text-teal-500", bg: "bg-teal-50", border: "border-teal-100" },
    { label: "Satisfação Média", value: avgSatisfaction ? `${avgSatisfaction}/10` : "—", icon: Star, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
    { label: "Novos Cadastros", value: unlinkedClients.length, icon: UserPlus, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
  ];

  // If viewing company detail
  if (view === "company_detail" && selectedCompany) {
    const company = enrichedCompanies.find(c => c.id === selectedCompany);
    return (
      <div className="min-h-screen bg-slate-50">
        <ClientProjectSettings
          company={company}
          projects={projects}
          contacts={contacts}
          allAccess={allAccess}
          deliveries={deliveries}
          surveys={surveys}
          meetings={meetings}
          onBack={() => { setView("companies"); setSelectedCompany(null); }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Central do Cliente</h1>
            <p className="text-slate-500 text-sm mt-0.5">Gerencie portais, acessos, conteúdo e entregas por empresa.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((s, i) => (
            <div key={i} className={`bg-white border ${s.border} rounded-2xl p-4`}>
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="by_company" className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl mb-4 flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="by_company" className="gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm">
              <Building2 className="w-4 h-4" />
              Por Empresa
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-sm">
              <UserCog className="w-4 h-4" />
              Contatos & Acessos
            </TabsTrigger>
            <TabsTrigger value="new_clients" className="gap-2 rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white text-sm relative">
              <UserPlus className="w-4 h-4" />
              Novos Cadastros
              {unlinkedClients.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unlinkedClients.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Por Empresa */}
          <TabsContent value="by_company">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar empresa..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>

              {filteredCompanies.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Nenhuma empresa encontrada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCompanies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => { setSelectedCompany(company.id); setView("company_detail"); }}
                      className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      {/* Company header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {company.logo_url ? (
                            <img src={company.logo_url} alt={company.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-slate-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {company.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{company.name}</p>
                            <p className="text-xs text-slate-400 truncate">{company.segment || "—"}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-slate-50 rounded-xl">
                          <p className="text-lg font-bold text-slate-800">{company.companyProjects.length}</p>
                          <p className="text-[10px] text-slate-500">Projetos</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-xl">
                          <p className="text-lg font-bold text-blue-700">{company.portalProjects.length}</p>
                          <p className="text-[10px] text-blue-500">Portais</p>
                        </div>
                        <div className="text-center p-2 bg-emerald-50 rounded-xl">
                          <p className="text-lg font-bold text-emerald-700">{company.activeContacts.length}</p>
                          <p className="text-[10px] text-emerald-500">Clientes</p>
                        </div>
                      </div>

                      {/* Alerts */}
                      <div className="space-y-2">
                        {company.pendingDeliveries.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span className="text-xs text-amber-700">{company.pendingDeliveries.length} entrega(s) aguardando aprovação</span>
                          </div>
                        )}
                        {company.avgScore && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                            <Star className="w-3.5 h-3.5 text-purple-500 fill-purple-500 flex-shrink-0" />
                            <span className="text-xs text-purple-700">Satisfação média: {company.avgScore}/10</span>
                          </div>
                        )}
                        {company.companyProjects.length === 0 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                            <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-xs text-slate-500">Nenhum projeto vinculado</span>
                          </div>
                        )}
                      </div>

                      {/* Portal badges */}
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                        {company.portalProjects.length > 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                            <Globe className="w-2.5 h-2.5 mr-1" />
                            {company.portalProjects.length} portal{company.portalProjects.length > 1 ? "is" : ""} ativo{company.portalProjects.length > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[10px]">Sem portal ativo</Badge>
                        )}
                        {company.activeContacts.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">
                            <Shield className="w-2.5 h-2.5 mr-1" />
                            {company.activeContacts.length} acesso{company.activeContacts.length > 1 ? "s" : ""} ativo{company.activeContacts.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Contatos & Acessos */}
          <TabsContent value="access">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <ClientAccessManager companies={companies} projects={projects} />
            </div>
          </TabsContent>

          {/* Tab: Novos Cadastros */}
          <TabsContent value="new_clients">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Novos Clientes Cadastrados</h2>
                  <p className="text-xs text-slate-500">Clientes que criaram conta mas ainda não foram vinculados a nenhum projeto.</p>
                </div>
              </div>

              {unlinkedClients.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Todos os clientes já estão vinculados a projetos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unlinkedClients.map(profile => (
                    <div key={profile.id} className="flex items-center gap-4 p-4 border border-purple-100 bg-purple-50/50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(profile.full_name || profile.display_name || profile.user_email || "?")
                          .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {profile.full_name || profile.display_name || "—"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{profile.user_email}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Cadastrado em {new Date(profile.created_date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs flex-shrink-0">Aguardando vinculação</Badge>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                    <Link2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Para vincular um cliente a um projeto, acesse a aba <strong>Contatos & Acessos</strong> e adicione o e-mail do cliente ao projeto correspondente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}