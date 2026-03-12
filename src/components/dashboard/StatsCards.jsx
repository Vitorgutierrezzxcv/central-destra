import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
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
      accent: "#456C8D",
      bg: "#F0F4F8",
      filterStatus: "pending"
    },
    {
      title: "Em Andamento",
      value: inProgressTasks,
      icon: TrendingUp,
      accent: "#6FA6FF",
      bg: "#EBF3FF",
      filterStatus: "in_progress"
    },
    {
      title: "Concluídas",
      value: completedTasks,
      icon: CheckCircle2,
      accent: "#131A20",
      bg: "#EAEAEA",
      filterStatus: "completed"
    },
    {
      title: "Atrasadas",
      value: overdueTasks,
      icon: AlertCircle,
      accent: "#C0392B",
      bg: "#FEF0EE",
      filterStatus: "overdue"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => (
        <Link
          key={card.title}
          to={`${createPageUrl("Tasks")}?status=${card.filterStatus}&assignedTo=${user?.email || ''}`}
          className="block"
        >
          <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 hover:border-[#6FA6FF]/30 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: card.bg }}
              >
                <card.icon className="w-4 h-4" style={{ color: card.accent }} />
              </div>
            </div>
            <div
              className="text-3xl font-light text-[#131A20] tabular-nums mb-1"
            >
              {card.value}
            </div>
            <p className="text-xs font-light text-[#456C8D]">{card.title}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}