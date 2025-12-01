import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function StatsCards({ pendingTasks, inProgressTasks, completedTasks, overdueTasks }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const cards = [
    {
      title: "Pendentes",
      value: pendingTasks,
      icon: Clock,
      bgColor: "bg-white border border-[#EAEAEA]",
      iconColor: "text-[#456C8D]",
      delay: 0,
      filterStatus: "pending"
    },
    {
      title: "Em Andamento",
      value: inProgressTasks,
      icon: TrendingUp,
      bgColor: "bg-white border border-[#EAEAEA]",
      iconColor: "text-[#6FA6FF]",
      delay: 0.1,
      filterStatus: "in_progress"
    },
    {
      title: "Concluídas",
      value: completedTasks,
      icon: CheckCircle2,
      bgColor: "bg-white border border-[#EAEAEA]",
      iconColor: "text-[#131A20]",
      delay: 0.2,
      filterStatus: "completed"
    },
    {
      title: "Atrasadas",
      value: overdueTasks,
      icon: AlertCircle,
      bgColor: "bg-white border border-[#EAEAEA]",
      iconColor: "text-red-500",
      delay: 0.3,
      filterStatus: "overdue"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
      {cards.map((card) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay }}
        >
          <Link 
            to={`${createPageUrl("Tasks")}?status=${card.filterStatus}&assignedTo=${user?.email || ''}`}
            className="block"
          >
            <Card className={`${card.bgColor} shadow-sm hover:shadow-md transition-all rounded-xl md:rounded-2xl overflow-hidden cursor-pointer hover:scale-105`}>
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
                  <div className="bg-[#EAEAEA] rounded-xl p-2 md:p-3 mb-2 md:mb-0 w-fit">
                    <card.icon className={`w-4 h-4 md:w-6 md:h-6 ${card.iconColor}`} />
                  </div>
                  <div className="md:text-right">
                    <div className={`text-2xl md:text-4xl font-semibold ${card.iconColor}`}>
                      {card.value}
                    </div>
                  </div>
                </div>
                <p className="text-[#456C8D] font-medium text-xs md:text-sm">{card.title}</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}