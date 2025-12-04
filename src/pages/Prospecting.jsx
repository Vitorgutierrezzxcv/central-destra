import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, Calendar, Plus, Settings, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import AccessGuard from "../components/layout/AccessGuard";

function ProspectingContent() {
  const [showForm, setShowForm] = useState(false);
  const [showGoalsManager, setShowGoalsManager] = useState(false);
  const [selectedFormDate, setSelectedFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState("week");
  const [comparisonPeriod, setComparisonPeriod] = useState("previous");
  const [selectedSeller, setSelectedSeller] = useState("all");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Usar UserProfile que é acessível a todos os usuários
  const { data: userProfiles } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  // Mapeia os perfis para o formato esperado
  const users = userProfiles.map(profile => ({
    email: profile.user_email,
    full_name: profile.full_name || profile.display_name || profile.user_email
  }));

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
    mutationFn: (id) => base44.entities.ProspectLead.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prospect-leads'] }),
  });



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

  const currentLeads = filterLeadsByRange(sellerFilteredLeads, currentStart, currentEnd);
  const comparisonLeads = filterLeadsByRange(sellerFilteredLeads, compStart, compEnd);

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

        {/* Dashboard */}
        <Tabs defaultValue="leads" className="w-full">
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
            >
              Métricas
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              className="data-[state=active]:bg-[#6FA6FF] data-[state=active]:text-white rounded-lg px-4 py-2"
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
              onDeleteLead={(id) => deleteLeadMutation.mutate(id)}
              isLoading={createLeadMutation.isPending || updateLeadMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            {loadingLeads ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Carregando métricas...</p>
              </div>
            ) : sellerFilteredLeads.length > 0 ? (
              <>
                <ProspectingMetricsCards
                  leads={sellerFilteredLeads}
                  comparisonLeads={comparisonLeads}
                  dateRangeLabel={format(currentStart, "dd MMM", { locale: ptBR }) + " - " + format(currentEnd, "dd MMM", { locale: ptBR })}
                />
                <ConversionFunnel leads={sellerFilteredLeads} />
                <ProspectingCharts
                  leads={sellerFilteredLeads}
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
            <ProspectingGoalsManager
                              goals={goals}
                              userEmail={user?.email}
                              metrics={currentLeads}
                              embedded={true}
                            />
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