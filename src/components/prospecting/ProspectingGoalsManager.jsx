import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Target, TrendingUp, X, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const metricLabels = {
  instagram_leads: "Leads Prospectados",
  instagram_responses: "Respostas Recebidas",
  whatsapp_collected: "WhatsApps Coletados",
  meetings_scheduled: "Reuniões Marcadas",
  meetings_held: "Reuniões Realizadas",
  follow_ups_sent: "Follow-ups Enviados",
  follow_ups_responses: "Follow-ups Respondidos",
  sales_amount: "Vendas (R$)",
};

const periodLabels = {
  daily: "Diária",
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

export default function ProspectingGoalsManager({ goals, userEmail, metrics = [], embedded = false, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [newGoal, setNewGoal] = useState({
    period: "weekly",
    metric_type: "instagram_leads",
    goal_value: 0,
    start_date: new Date().toISOString().split('T')[0],
  });

  const queryClient = useQueryClient();

  const createGoalMutation = useMutation({
    mutationFn: (goalData) => base44.entities.ProspectingGoal.create({ ...goalData, user_email: userEmail, active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-goals'] });
      setShowForm(false);
      setNewGoal({
        period: "weekly",
        metric_type: "instagram_leads",
        goal_value: 0,
        start_date: new Date().toISOString().split('T')[0],
      });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProspectingGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-goals'] });
      setShowForm(false);
      setEditingGoal(null);
      setNewGoal({
        period: "weekly",
        metric_type: "instagram_leads",
        goal_value: 0,
        start_date: new Date().toISOString().split('T')[0],
      });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.ProspectingGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospecting-goals'] });
    },
  });

  const handleCreateGoal = () => {
    if (newGoal.goal_value > 0) {
      if (editingGoal) {
        updateGoalMutation.mutate({ id: editingGoal.id, data: newGoal });
      } else {
        createGoalMutation.mutate(newGoal);
      }
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setNewGoal({
      period: goal.period,
      metric_type: goal.metric_type,
      goal_value: goal.goal_value,
      start_date: goal.start_date,
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingGoal(null);
    setNewGoal({
      period: "weekly",
      metric_type: "instagram_leads",
      goal_value: 0,
      start_date: new Date().toISOString().split('T')[0],
    });
  };

  const calculateProgress = (goal) => {
    const currentValue = getCurrentValue(goal);
    return goal.goal_value > 0 ? Math.min((currentValue / goal.goal_value) * 100, 100) : 0;
  };

  const getCurrentValue = (goal) => {
    if (!metrics || metrics.length === 0) return 0;
    
    // Mapeamento correto das métricas dos leads
    const metricMapping = {
      instagram_leads: 'prospectado',
      instagram_responses: 'respondeu',
      whatsapp_collected: 'whatsapp',
      meetings_scheduled: 'reuniao_marcada',
      meetings_held: 'reuniao_realizada',
      follow_ups_sent: 'proposta_enviada',
      follow_ups_responses: 'segunda_reuniao_marcada',
      sales_amount: 'venda_fechada',
    };

    const targetStage = metricMapping[goal.metric_type];
    if (!targetStage) return 0;

    const stageOrder = ['prospectado', 'respondeu', 'whatsapp', 'reuniao_marcada', 'no_show', 'reuniao_realizada', 'proposta_enviada', 'segunda_reuniao_marcada', 'venda_fechada', 'perdido'];
    
    if (goal.metric_type === 'sales_amount') {
      // Para vendas, soma os valores dos leads fechados
      return metrics
        .filter(l => l.stage === 'venda_fechada')
        .reduce((sum, l) => sum + (l.potential_value || 0), 0);
    }
    
    // Para outras métricas, conta leads que passaram pelo estágio
    const stageIndex = stageOrder.indexOf(targetStage);
    return metrics.filter(l => {
      if (!l.stage) return false;
      const leadStageIndex = stageOrder.indexOf(l.stage);
      
      if (targetStage === 'prospectado') return l.stage !== 'perdido';
      return leadStageIndex >= stageIndex && l.stage !== 'perdido';
    }).length;
  };

  const content = (
    <div className="space-y-6">
      {/* Add Goal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period">Período</Label>
                    <Select value={newGoal.period} onValueChange={(value) => setNewGoal({ ...newGoal, period: value })}>
                      <SelectTrigger id="period">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(periodLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metric_type">Métrica</Label>
                    <Select value={newGoal.metric_type} onValueChange={(value) => setNewGoal({ ...newGoal, metric_type: value })}>
                      <SelectTrigger id="metric_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(metricLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal_value">Meta</Label>
                    <Input
                      id="goal_value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newGoal.goal_value}
                      onChange={(e) => setNewGoal({ ...newGoal, goal_value: parseFloat(e.target.value) || 0 })}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date">Data de Início</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newGoal.start_date}
                      onChange={(e) => setNewGoal({ ...newGoal, start_date: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateGoal}
                    disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {editingGoal ? 'Salvar Meta' : 'Criar Meta'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals List */}
      {goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal);
            const currentValue = getCurrentValue(goal);
            const isCurrency = goal.metric_type === "sales_amount";

            return (
              <Card key={goal.id} className="bg-white/80 backdrop-blur-sm shadow-lg border-none rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-bold mb-1">
                        {metricLabels[goal.metric_type]}
                      </CardTitle>
                      <p className="text-xs text-white/80">
                        Meta {periodLabels[goal.period]}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(goal)}
                        className="text-white hover:bg-white/20 h-8 w-8"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                        className="text-white hover:bg-white/20 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Progresso:</span>
                    <span className="font-bold text-slate-900">
                      {isCurrency 
                        ? `R$ ${currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : currentValue
                      }
                      {" / "}
                      {isCurrency
                        ? `R$ ${goal.goal_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : goal.goal_value
                      }
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {progress >= 100 ? (
                        <>
                          <Target className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-semibold">Meta atingida!</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-600 font-semibold">{progress.toFixed(1)}%</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-none rounded-2xl">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma meta definida</h3>
            <p className="text-slate-600 mb-6">
              Defina suas metas para acompanhar seu progresso
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Goal Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 h-12"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Meta
        </Button>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-200">
        <CardHeader className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900">Gerenciar Metas</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {content}
        </CardContent>
      </Card>
    </motion.div>
  );
}