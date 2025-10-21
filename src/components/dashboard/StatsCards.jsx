import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsCards({ pendingTasks, inProgressTasks, completedTasks, overdueTasks }) {
  const cards = [
    {
      title: "Tarefas Pendentes",
      value: pendingTasks,
      icon: Clock,
      gradient: "from-yellow-500 to-orange-600",
      delay: 0
    },
    {
      title: "Em Andamento",
      value: inProgressTasks,
      icon: TrendingUp,
      gradient: "from-blue-500 to-blue-600",
      delay: 0.1
    },
    {
      title: "Concluídas",
      value: completedTasks,
      icon: CheckCircle2,
      gradient: "from-green-500 to-green-600",
      delay: 0.2
    },
    {
      title: "Atrasadas",
      value: overdueTasks,
      icon: AlertCircle,
      gradient: "from-red-500 to-red-600",
      delay: 0.3
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay }}
        >
          <Card className={`bg-gradient-to-br ${card.gradient} text-white border-none shadow-lg hover:shadow-xl transition-shadow`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90">
                  {card.title}
                </CardTitle>
                <card.icon className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}