import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ProspectingMetricsCards({ currentMetrics, comparisonMetrics, dateRangeLabel }) {
  const calculateTotal = (metrics, key) => {
    return metrics.reduce((sum, m) => sum + (m[key] || 0), 0);
  };

  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const metrics = [
    { key: "instagram_leads", label: "Leads Prospectados", icon: "📱", color: "from-blue-400 to-blue-600" },
    { key: "instagram_responses", label: "Respostas", icon: "💬", color: "from-purple-400 to-purple-600" },
    { key: "whatsapp_collected", label: "WhatsApps", icon: "📞", color: "from-green-400 to-green-600" },
    { key: "meetings_scheduled", label: "Reuniões Marcadas", icon: "📅", color: "from-orange-400 to-orange-600" },
    { key: "meetings_held", label: "Reuniões Realizadas", icon: "✅", color: "from-teal-400 to-teal-600" },
    { key: "no_shows", label: "No-Shows", icon: "❌", color: "from-red-400 to-red-600" },
    { key: "follow_ups_sent", label: "Follow-ups", icon: "📧", color: "from-indigo-400 to-indigo-600" },
    { key: "follow_ups_responses", label: "Follow-ups Resp.", icon: "✉️", color: "from-pink-400 to-pink-600" },
    { key: "sales_amount", label: "Vendas", icon: "💰", color: "from-amber-400 to-amber-600", isCurrency: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {metrics.map((metric) => {
        const currentValue = calculateTotal(currentMetrics, metric.key);
        const previousValue = calculateTotal(comparisonMetrics, metric.key);
        const change = calculateChange(currentValue, previousValue);
        const isPositive = change > 0;
        const isNegative = change < 0;

        return (
          <Card
            key={metric.key}
            className={`bg-gradient-to-br ${metric.color} border-none shadow-lg hover:shadow-xl transition-all rounded-2xl`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{metric.icon}</span>
                {change !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                    isPositive ? 'bg-white/30 text-white' : 
                    isNegative ? 'bg-white/30 text-white' : 
                    'bg-white/20 text-white'
                  }`}>
                    {isPositive && <TrendingUp className="w-3 h-3" />}
                    {isNegative && <TrendingDown className="w-3 h-3" />}
                    {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
                    {Math.abs(change).toFixed(0)}%
                  </div>
                )}
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                {metric.isCurrency ? `R$ ${currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : currentValue}
              </div>
              <p className="text-white/90 font-medium text-xs line-clamp-2">{metric.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}