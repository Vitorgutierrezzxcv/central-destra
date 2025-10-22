import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, Award } from "lucide-react";

export default function OpportunityMetrics({ opportunities }) {
  const openOpportunities = opportunities.filter(o => o.status === 'open');
  
  const totalValue = openOpportunities.reduce((sum, o) => sum + (o.value || 0), 0);
  
  const avgValue = openOpportunities.length > 0 
    ? totalValue / openOpportunities.length 
    : 0;

  const highPriorityCount = openOpportunities.filter(o => o.priority === 'high').length;

  const closingStage = openOpportunities.filter(o => 
    o.stage === 'closing' || o.stage === 'negotiation'
  ).length;

  const metrics = [
    {
      title: "Total em Pipeline",
      value: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "from-emerald-400 to-teal-500"
    },
    {
      title: "Ticket Médio",
      value: `R$ ${avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "from-blue-400 to-indigo-500"
    },
    {
      title: "Alta Prioridade",
      value: highPriorityCount,
      icon: Award,
      color: "from-red-400 to-pink-500"
    },
    {
      title: "Próximo de Fechar",
      value: closingStage,
      icon: Target,
      color: "from-purple-400 to-pink-500"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index} className="bg-white border-none shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-md`}>
                <metric.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
              {metric.value}
            </div>
            <p className="text-xs md:text-sm text-slate-600">{metric.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}