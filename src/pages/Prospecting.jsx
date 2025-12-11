import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, Calendar, Plus, Settings, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { AnimatePresence } from "framer-motion";
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  format,
  parseISO,
  isWithinInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";

import ProspectingForm from "../components/prospecting/ProspectingForm";
import ProspectingMetricsCards from "../components/prospecting/ProspectingMetricsCards";
import ProspectingCharts from "../components/prospecting/ProspectingCharts";
import ProspectingGoalsManager from "../components/prospecting/ProspectingGoalsManager";
import ConversionFunnel from "../components/prospecting/ConversionFunnel";
import LeadsPipeline from "../components/prospecting/LeadsPipeline";
import LeadsListModal from "../components/prospecting/LeadsListModal";
import ProspectingNotes from "../components/prospecting/ProspectingNotes";
import ProspectingAIChat from "../components/prospecting/ProspectingAIChat";
import SourceMetrics from "../components/prospecting/SourceMetrics";
import AccessGuard from "../components/layout/AccessGuard";
import DailyGoalsWidget from "../components/prospecting/DailyGoalsWidget";

function ProspectingContent() {
  const [showForm, setShowForm] = useState(false);
  const [showGoalsManager, setShowGoalsManager] = useState(false);
  const [selectedFormDate, setSelectedFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('prospecting-view-mode') || "period");
  const [customStartDate, setCustomStartDate] = useState(() => localStorage.getItem('prospecting-custom-start') || "");
  const [customEndDate, setCustomEndDate] = useState(() => localStorage.getItem('prospecting-custom-end') || "");
  const queryClient = useQueryClient();

  // Carregar preferências salvas
  const [dateRange, setDateRange] = useState(() => localStorage.getItem('prospecting-date-range') || "week");
  const [comparisonPeriod, setComparisonPeriod] = useState(() => localStorage.getItem('prospecting-comparison') || "previous");
  const [selectedSeller, setSelectedSeller] = useState(() => localStorage.getItem('prospecting-seller') || "all");

  // Salvar preferências quando mudarem
  React.useEffect(() => {
    localStorage.setItem('prospecting-view-mode', viewMode);
  }, [viewMode]);

  React.useEffect(() => {
    localStorage.setItem('prospecting-date-range', dateRange);
  }, [dateRange]);

  React.useEffect(() => {
    localStorage.setItem('prospecting-comparison', comparisonPeriod);
  }, [comparisonPeriod]);

  React.useEffect(() => {
    localStorage.setItem('prospecting-seller', selectedSeller);
  }, [selectedSeller]);

  React.useEffect(() => {
    localStorage.setItem('prospecting-custom-start', customStartDate);
  }, [customStartDate]);

  React.useEffect(() => {
    localStorage.setItem('prospecting-custom-end', customEndDate);
  }, [customEndDate]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Usar UserProfile para listar vendedores - acessível a todos
  const { data: userProfiles } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  // Mapeia os perfis para o formato esperado - todos os usuários aparecem
  const users = userProfiles.map(profile => ({
    email: profile.user_email,
    full_name: profile.full_name || profile.display_name || profile.user_email
  }));

  // Para compatibilidade
  const prospectingUsers = users;

  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ['prospecting-goals', user?.email],
    queryFn: () => base44.entities.ProspectingGoal.filter({ user_email: user.email, active: true }),
    initialData: [],
    enabled: !!user,
  });

  // Leads Pipeline
  const { data: leads, isLoading: loadingLeads } = useQuery({
    queryKey: ['prospect-leads'],
    queryFn: () => base44.entities.ProspectLead.list('-created_date'),
    initialData: [],
  });

  const createLeadMutation = useMutation({
    mutationFn: (leadData) => base44.entities.ProspectLead.create(leadData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prospect-leads'] }),
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProspectLead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prospect-leads'] }),
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (lead) => {
      // Se o lead tem oportunidade, marcar como perdida antes de deletar
      if (lead.opportunity_id) {
        try {
          await base44.entities.Opportunity.update(lead.opportunity_id, {
            status: "lost",
            actual_close_date: new Date().toISOString().split('T')[0],
          });
        } catch (error) {
          console.error('Erro ao atualizar oportunidade:', error);
        }
      }
      
      // Registrar no histórico antes de deletar
      try {
        await base44.entities.LeadStageHistory.create({
          lead_id: lead.id,
          lead_name: lead.name,
          previous_stage: lead.stage,
          new_stage: "deleted",
          changed_by: user?.email || "system",
          change_date: new Date().toISOString(),
          notes: "Lead deletado"
        });
      } catch (error) {
        console.error('Erro ao criar histórico:', error);
      }
      
      return base44.entities.ProspectLead.delete(lead.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect-leads'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  // Criar oportunidades para leads existentes que não têm
  const createOpportunityMutation = useMutation({
    mutationFn: (data) => base44.entities.Opportunity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    }
  });

  // Processa leads existentes quando a página carrega
  React.useEffect(() => {
    if (!leads || leads.length === 0) return;

    const stagesThatNeedOpportunity = ["whatsapp", "reuniao_marcada", "no_show", "reuniao_realizada", "proposta_enviada", "segunda_reuniao_marcada", "venda_fechada"];
    
    const leadsToProcess = leads.filter(lead => 
      stagesThatNeedOpportunity.includes(lead.stage) && !lead.opportunity_id
    );

    if (leadsToProcess.length === 0) return;

    // Processa cada lead sem oportunidade
    leadsToProcess.forEach(async (lead) => {
      try {
        const opportunity = await createOpportunityMutation.mutateAsync({
          title: `${lead.name}${lead.company_segment ? ' - ' + lead.company_segment : ''}`,
          company_name: lead.name,
          stage: "qualification",
          status: "open",
          source: lead.source,
          contact_name: lead.name,
          contact_email: lead.email,
          contact_phone: lead.whatsapp,
          value: lead.potential_value || 0,
          assigned_to: lead.seller_email,
          needs: lead.notes,
          next_step: "Continuar follow-up"
        });
        
        if (opportunity?.id) {
          await updateLeadMutation.mutateAsync({ 
            id: lead.id, 
            data: { opportunity_id: opportunity.id } 
          });
        }
      } catch (error) {
        console.error('Erro ao criar oportunidade para lead:', lead.name, error);
      }
    });
  }, [leads]);

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "day":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case "biweek":
        return { start: subWeeks(startOfWeek(now, { locale: ptBR }), 1), end: endOfWeek(now, { locale: ptBR }) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "custom":
        if (customStartDate && customEndDate) {
          return { 
            start: startOfDay(parseISO(customStartDate)), 
            end: endOfDay(parseISO(customEndDate)) 
          };
        }
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      default:
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
    }
  };

  const getComparisonDateRange = () => {
    const { start, end } = getDateRangeFilter();
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    switch (comparisonPeriod) {
      case "previous":
        return {
          start: subDays(start, daysDiff),
          end: subDays(end, daysDiff)
        };
      case "lastWeek":
        return {
          start: subWeeks(startOfWeek(start, { locale: ptBR }), 1),
          end: subWeeks(endOfWeek(end, { locale: ptBR }), 1)
        };
      case "lastMonth":
        return {
          start: subMonths(startOfMonth(start), 1),
          end: subMonths(endOfMonth(end), 1)
        };
      default:
        return {
          start: subDays(start, daysDiff),
          end: subDays(end, daysDiff)
        };
    }
  };

  const { start: currentStart, end: currentEnd } = getDateRangeFilter();
  const { start: compStart, end: compEnd } = getComparisonDateRange();

  // Filter leads by date range and seller
  const filterLeadsByRange = (leadsData, start, end) => {
    return leadsData.filter(l => {
      if (!l.last_contact_date && !l.created_date) return false;
      const leadDate = parseISO(l.last_contact_date || l.created_date?.split('T')[0]);
      return isWithinInterval(leadDate, { start, end });
    });
  };

  const sellerFilteredLeads = selectedSeller === "all"
    ? leads
    : leads.filter(l => l.seller_email === selectedSeller);

  // Se modo total, usa todos os leads filtrados por vendedor
  // Se modo período, filtra por data
  const currentLeads = viewMode === "total" 
    ? sellerFilteredLeads 
    : filterLeadsByRange(sellerFilteredLeads, currentStart, currentEnd);
  const comparisonLeads = filterLeadsByRange(sellerFilteredLeads, compStart, compEnd);

  const handleStageClick = (stage) => {
    setSelectedStage(stage);
    setShowLeadsModal(true);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#6FA6FF] rounded-xl md:rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Prospecção</h1>
              <p className="text-sm md:text-base text-slate-600">
                Acompanhe suas métricas de social selling
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            {/* Toggle de Visualização */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={viewMode === "period" ? "default" : "outline"}
                onClick={() => setViewMode("period")}
                className={`h-10 md:h-11 rounded-lg ${viewMode === "period" ? 'bg-[#6FA6FF] hover:bg-[#456C8D]' : ''}`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Por Período
              </Button>
              <Button
                variant={viewMode === "total" ? "default" : "outline"}
                onClick={() => setViewMode("total")}
                className={`h-10 md:h-11 rounded-lg ${viewMode === "total" ? 'bg-[#6FA6FF] hover:bg-[#456C8D]' : ''}`}
              >
                <Users className="w-4 h-4 mr-2" />
                Visão Total
              </Button>
            </div>

            {/* Filtros de período - só aparecem no modo "period" */}
            {viewMode === "period" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-full bg-white border-[#EAEAEA] h-10 md:h-11 rounded-lg">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Hoje</SelectItem>
                      <SelectItem value="week">Esta Semana</SelectItem>
                      <SelectItem value="biweek">Últimas 2 Semanas</SelectItem>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="custom">Período Personalizado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
                    <SelectTrigger className="w-full bg-white border-[#EAEAEA] h-10 md:h-11 rounded-lg">
                      <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previous">Período Anterior</SelectItem>
                      <SelectItem value="lastWeek">Semana Passada</SelectItem>
                      <SelectItem value="lastMonth">Mês Passado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos de data personalizada */}
                {dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[#456C8D] mb-1 block">Data Início</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-10 border-[#EAEAEA]"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {customStartDate ? format(parseISO(customStartDate), "dd/MM/yyyy", { locale: ptBR }) : "Selecione..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={customStartDate ? parseISO(customStartDate) : undefined}
                            onSelect={(date) => setCustomStartDate(date ? format(date, "yyyy-MM-dd") : "")}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-xs text-[#456C8D] mb-1 block">Data Fim</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-10 border-[#EAEAEA]"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {customEndDate ? format(parseISO(customEndDate), "dd/MM/yyyy", { locale: ptBR }) : "Selecione..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={customEndDate ? parseISO(customEndDate) : undefined}
                            onSelect={(date) => setCustomEndDate(date ? format(date, "yyyy-MM-dd") : "")}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Seller Filter */}
            <Select value={selectedSeller} onValueChange={setSelectedSeller}>
              <SelectTrigger className="w-full bg-white border-[#EAEAEA] h-10 md:h-11 rounded-lg">
                <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder="Filtrar por vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Vendedores</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.email} value={u.email}>
                    {u.full_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2">
              <Button
                onClick={() => setShowGoalsManager(true)}
                variant="outline"
                className="bg-white border-[#EAEAEA] rounded-lg h-10 md:h-11 px-3 md:px-6"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden md:inline text-sm md:text-base">Gerenciar Metas</span>
                <span className="md:hidden text-sm">Metas</span>
              </Button>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedFormDate}
                  onChange={(e) => setSelectedFormDate(e.target.value)}
                  className="h-10 md:h-11 px-3 rounded-lg border border-[#EAEAEA] bg-white text-sm"
                />
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg h-10 md:h-11 px-3 md:px-6"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                  <span className="hidden md:inline text-sm md:text-base font-medium">
                    Registrar Leads
                  </span>
                  <span className="md:hidden text-sm font-medium">
                    Registrar
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Forms */}
        <AnimatePresence>
          {showForm && (
            <ProspectingForm
              date={selectedFormDate}
              onCancel={() => setShowForm(false)}
              currentUserEmail={user?.email}
              allLeads={leads}
              prospectingUsers={prospectingUsers}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showGoalsManager && (
            <ProspectingGoalsManager
              goals={goals}
              userEmail={user?.email}
              onClose={() => setShowGoalsManager(false)}
            />
          )}
        </AnimatePresence>

        {/* Modal de Lista de Leads */}
        <LeadsListModal
          isOpen={showLeadsModal}
          onClose={() => setShowLeadsModal(false)}
          leads={currentLeads}
          stage={selectedStage}
          users={users}
        />

        {/* Daily Goals Widget - sempre visível */}
        <DailyGoalsWidget 
          goals={goals} 
          leads={sellerFilteredLeads}
        />

        {/* Dashboard */}
        <Tabs defaultValue={viewMode === "total" ? "leads" : "metrics"} className="w-full">
          <TabsList className="bg-[#EAEAEA] mb-6 p-1 h-auto grid grid-cols-3 w-full sm:w-auto rounded-lg">
            <TabsTrigger
              value="leads"
              className="data-[state=active]:bg-[#6FA6FF] data-[state=active]:text-white rounded-lg px-4 py-2"
            >
              Pipeline
            </TabsTrigger>
            <TabsTrigger
              value="metrics"
              className="data-[state=active]:bg-[#6FA6FF] data-[state=active]:text-white rounded-lg px-4 py-2"
              disabled={viewMode === "total"}
            >
              Métricas
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              className="data-[state=active]:bg-[#6FA6FF] data-[state=active]:text-white rounded-lg px-4 py-2"
              disabled={viewMode === "total"}
            >
              Metas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-6">
            <LeadsPipeline
              leads={leads}
              users={users}
              currentUser={user}
              selectedSeller={selectedSeller}
              onCreateLead={(data) => createLeadMutation.mutate(data)}
              onUpdateLead={(id, data) => updateLeadMutation.mutate({ id, data })}
              onDeleteLead={(lead) => deleteLeadMutation.mutate(lead)}
              isLoading={createLeadMutation.isPending || updateLeadMutation.isPending || deleteLeadMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            {viewMode === "total" ? (
              <Card className="bg-white border border-[#EAEAEA] rounded-xl">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 text-[#EAEAEA] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#131A20] mb-2">
                    Métricas não disponíveis na visão total
                  </h3>
                  <p className="text-[#456C8D] mb-6">
                    Selecione "Por Período" para ver as métricas e análises
                  </p>
                  <Button
                    onClick={() => setViewMode("period")}
                    className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg"
                  >
                    Ver Por Período
                  </Button>
                </CardContent>
              </Card>
            ) : loadingLeads ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Carregando métricas...</p>
              </div>
            ) : currentLeads.length > 0 ? (
              <>
                <ProspectingMetricsCards
                  leads={currentLeads}
                  comparisonLeads={comparisonLeads}
                  dateRangeLabel={format(currentStart, "dd MMM", { locale: ptBR }) + " - " + format(currentEnd, "dd MMM", { locale: ptBR })}
                  onStageClick={handleStageClick}
                />
                <ConversionFunnel 
                  leads={currentLeads}
                  onStageClick={handleStageClick}
                />

                <SourceMetrics leads={currentLeads} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProspectingAIChat
                    leads={currentLeads}
                    dateRangeLabel={format(currentStart, "dd MMM", { locale: ptBR }) + " - " + format(currentEnd, "dd MMM", { locale: ptBR })}
                  />
                  <ProspectingNotes
                    userEmail={user?.email}
                    dateRange={dateRange}
                  />
                </div>

                <ProspectingCharts
                  leads={currentLeads}
                  goals={goals}
                  dateRange={dateRange}
                />
              </>
            ) : (
              <Card className="bg-white border border-[#EAEAEA] rounded-xl">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-[#EAEAEA] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#131A20] mb-2">
                    Nenhuma métrica registrada
                  </h3>
                  <p className="text-[#456C8D] mb-6">
                    Comece registrando suas métricas diárias de prospecção
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Registrar Primeira Métrica
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            {viewMode === "total" ? (
              <Card className="bg-white border border-[#EAEAEA] rounded-xl">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-[#EAEAEA] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#131A20] mb-2">
                    Metas não disponíveis na visão total
                  </h3>
                  <p className="text-[#456C8D] mb-6">
                    Selecione "Por Período" para gerenciar suas metas
                  </p>
                  <Button
                    onClick={() => setViewMode("period")}
                    className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg"
                  >
                    Ver Por Período
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ProspectingGoalsManager
                goals={goals}
                userEmail={user?.email}
                metrics={currentLeads}
                embedded={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Prospecting() {
  return (
    <AccessGuard requiredModule="prospecting">
      <ProspectingContent />
    </AccessGuard>
  );
}