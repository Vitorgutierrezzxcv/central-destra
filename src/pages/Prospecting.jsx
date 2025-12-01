import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, Calendar, Plus, Settings } from "lucide-react";
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
import AccessGuard from "../components/layout/AccessGuard";

function ProspectingContent() {
  const [showForm, setShowForm] = useState(false);
  const [showGoalsManager, setShowGoalsManager] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null);
  const [dateRange, setDateRange] = useState("week");
  const [comparisonPeriod, setComparisonPeriod] = useState("previous");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['prospecting-metrics', user?.email],
    queryFn: () => base44.entities.ProspectingMetrics.filter({ user_email: user.email }, '-date'),
    initialData: [],
    enabled: !!user,
  });

  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ['prospecting-goals', user?.email],
    queryFn: () => base44.entities.ProspectingGoal.filter({ user_email: user.email, active: true }),
    initialData: [],
    enabled: !!user,
  });

  const createMetricMutation = useMutation({
    mutationFn: (metricData) => base44.entities.ProspectingMetrics.create({ ...metricData, user_email: user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-metrics'] });
      setShowForm(false);
      setEditingMetric(null);
    },
  });

  const updateMetricMutation = useMutation({
    mutationFn: ({ id, metricData }) => base44.entities.ProspectingMetrics.update(id, metricData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-metrics'] });
      setShowForm(false);
      setEditingMetric(null);
    },
  });

  const handleSubmit = (metricData) => {
    if (editingMetric) {
      updateMetricMutation.mutate({ id: editingMetric.id, metricData });
    } else {
      createMetricMutation.mutate(metricData);
    }
  };

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

  const filterMetricsByRange = (metricsData, start, end) => {
    return metricsData.filter(m => {
      if (!m.date) return false;
      const metricDate = parseISO(m.date);
      return isWithinInterval(metricDate, { start, end });
    });
  };

  const { start: currentStart, end: currentEnd } = getDateRangeFilter();
  const { start: compStart, end: compEnd } = getComparisonDateRange();

  const currentMetrics = filterMetricsByRange(metrics, currentStart, currentEnd);
  const comparisonMetrics = filterMetricsByRange(metrics, compStart, compEnd);

  // Check if there's already a metric for today
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMetric = metrics.find(m => m.date === today);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Prospecção</h1>
              <p className="text-sm md:text-base text-slate-600">
                Acompanhe suas métricas de social selling
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="flex gap-2 flex-wrap">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px] bg-white/80 backdrop-blur-sm border-slate-200 h-10 md:h-11 rounded-full">
                  <Calendar className="w-4 h-4 mr-2" />
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
                <SelectTrigger className="w-[160px] bg-white/80 backdrop-blur-sm border-slate-200 h-10 md:h-11 rounded-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous">Período Anterior</SelectItem>
                  <SelectItem value="lastWeek">Semana Passada</SelectItem>
                  <SelectItem value="lastMonth">Mês Passado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button
                onClick={() => setShowGoalsManager(true)}
                variant="outline"
                className="bg-white/80 backdrop-blur-sm shadow-md border-slate-200 rounded-full h-10 md:h-11 px-6"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                <span className="text-sm md:text-base">Gerenciar Metas</span>
              </Button>

              <Button
                onClick={() => {
                  setEditingMetric(todayMetric || null);
                  setShowForm(true);
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg rounded-full h-10 md:h-11 px-6"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                <span className="text-sm md:text-base font-medium">
                  {todayMetric ? 'Editar Hoje' : 'Registrar Hoje'}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Forms */}
        <AnimatePresence>
          {showForm && (
            <ProspectingForm
              metric={editingMetric}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingMetric(null);
              }}
              isLoading={createMetricMutation.isPending || updateMetricMutation.isPending}
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
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="bg-white/80 backdrop-blur-sm shadow-md mb-6 p-1 h-auto grid grid-cols-2 w-full sm:w-auto">
            <TabsTrigger
              value="metrics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2"
            >
              Métricas
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2"
            >
              Metas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-6">
            {loadingMetrics ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Carregando métricas...</p>
              </div>
            ) : currentMetrics.length > 0 ? (
              <>
                <ProspectingMetricsCards
                  currentMetrics={currentMetrics}
                  comparisonMetrics={comparisonMetrics}
                  dateRangeLabel={format(currentStart, "dd MMM", { locale: ptBR }) + " - " + format(currentEnd, "dd MMM", { locale: ptBR })}
                />
                <ProspectingCharts
                  metrics={currentMetrics}
                  goals={goals}
                  dateRange={dateRange}
                />
              </>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-none rounded-2xl">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Nenhuma métrica registrada
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Comece registrando suas métricas diárias de prospecção
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg rounded-full"
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
              metrics={currentMetrics}
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