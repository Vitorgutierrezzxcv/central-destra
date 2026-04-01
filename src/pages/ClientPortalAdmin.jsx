import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Building2, CheckCircle2, Clock, Star, AlertCircle, Globe, Eye, EyeOff, Settings, UserCog, UserPlus, Link2, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientAccessManager from "@/components/client-portal/ClientAccessManager";

export default function ClientPortalAdmin() {
  const qc = useQueryClient();

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

  // Usuários sem empresa vinculada (novos cadastros aguardando vinculação)
  const { data: allProfiles = [] } = useQuery({
    queryKey: ["admin_all_user_profiles"],
    queryFn: () => base44.entities.UserProfile.filter({ portal_type: "client" })
  });

  const { data: allAccess = [] } = useQuery({
    queryKey: ["admin_all_access"],
    queryFn: () => base44.entities.ProjectClientAccess.list()
  });

  // Clientes que não têm nenhum acesso vinculado
  const unlinkedClients = allProfiles.filter(profile =>
    !allAccess.some(a => a.user_email === profile.user_email)
  );

  const togglePortalMutation = useMutation({
    mutationFn: ({ project, enabled }) =>
      base44.entities.Project.update(project.id, { client_portal_enabled: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_all_projects"] })
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Central do Cliente</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie portais, acessos, contatos e entregas dos clientes.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="access" className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl mb-4 flex-wrap gap-1">
            <TabsTrigger value="access" className="gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <UserCog className="w-4 h-4" />
              Acessos dos Clientes
            </TabsTrigger>
            <TabsTrigger value="new_clients" className="gap-2 rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white relative">
              <UserPlus className="w-4 h-4" />
              Novos Cadastros
              {unlinkedClients.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unlinkedClients.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="portals" className="gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4" />
              Portais & Projetos
            </TabsTrigger>
          </TabsList>

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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Aguardando vinculação</Badge>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                    <Link2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Para vincular um cliente a um projeto, acesse a aba <strong>Acessos dos Clientes</strong> e adicione o e-mail do cliente ao projeto correspondente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Acessos */}
          <TabsContent value="access">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <ClientAccessManager companies={companies} projects={projects} />
            </div>
          </TabsContent>

          {/* Tab: Portais */}
          <TabsContent value="portals">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Projetos & Status do Portal</h2>
              <div className="space-y-3">
                {projects.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-8">Nenhum projeto cadastrado.</p>
                )}
                {projects.map(project => {
                  const company = companies.find(c => c.id === project.company_id);
                  const projectDeliveries = deliveries.filter(d => d.project_id === project.id);
                  const pendingCount = projectDeliveries.filter(d =>
                    ["delivered", "under_review"].includes(d.status)
                  ).length;

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
                        <Badge className={project.client_portal_enabled
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"}>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}