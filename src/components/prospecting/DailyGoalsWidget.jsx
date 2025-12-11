import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const metricLabels = {
  instagram_leads: "Leads",
  instagram_responses: "Respostas",
  whatsapp_collected: "WhatsApps",
};

export default function DailyGoalsWidget({ goals = [], leads = [] }) {
  // Filtra apenas metas diárias
  const dailyGoals = goals.filter(g => g.period === 'daily' && g.active);

  // Filtra apenas as 3 métricas principais que queremos mostrar
  const mainMetrics = ['instagram_leads', 'instagram_responses', 'whatsapp_collected'];
  const visibleGoals = dailyGoals.filter(g => mainMetrics.includes(g.metric_type));

  if (visibleGoals.length === 0) return null;

  const getCurrentValue = (goal) => {
    const metricMapping = {
      instagram_leads: 'prospectado',
      instagram_responses: 'respondeu',
      whatsapp_collected: 'whatsapp',
    };

    const targetStage = metricMapping[goal.metric_type];
    if (!targetStage) return 0;

    const stageOrder = ['prospectado', 'respondeu', 'whatsapp', 'reuniao_marcada', 'no_show', 'reuniao_realizada', 'proposta_enviada', 'segunda_reuniao_marcada', 'venda_fechada', 'perdido'];
    const stageIndex = stageOrder.indexOf(targetStage);
    
    return leads.filter(l => {
      if (!l.stage) return false;
      const leadStageIndex = stageOrder.indexOf(l.stage);
      
      if (targetStage === 'prospectado') return l.stage !== 'perdido';
      return leadStageIndex >= stageIndex && l.stage !== 'perdido';
    }).length;
  };

  return (
    <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 rounded-xl mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Metas de Hoje
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {visibleGoals.map(goal => {
            const currentValue = getCurrentValue(goal);
            const progress = goal.goal_value > 0 ? Math.min((currentValue / goal.goal_value) * 100, 100) : 0;
            const isComplete = progress >= 100;

            return (
              <div key={goal.id} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-slate-600 uppercase">
                    {metricLabels[goal.metric_type]}
                  </span>
                  {isComplete && (
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xl font-bold text-slate-900">{currentValue}</span>
                  <span className="text-xs text-slate-500">/ {goal.goal_value}</span>
                </div>
                <Progress 
                  value={progress} 
                  className={`h-1.5 ${isComplete ? 'bg-green-100' : ''}`}
                />
                <div className="mt-1 text-right">
                  <span className={`text-[10px] font-semibold ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}