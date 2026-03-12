import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function StatsCards({ pendingTasks, inProgressTasks, completedTasks, overdueTasks }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
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
  }];


  return (
    <div className="flex flex-col gap-2">
      {cards.map((card) =>
      <Link
        key={card.title}
        to={`${createPageUrl("Tasks")}?status=${card.filterStatus}&assignedTo=${user?.email || ''}`}
        className="block">
          <div className="bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 hover:border-[#6FA6FF]/30 transition-all cursor-pointer flex items-center gap-3">
            <div className="rounded-lg w-7 h-7 flex items-center justify-center shrink-0" style={{ background: card.bg }}>
              <card.icon className="w-3.5 h-3.5" style={{ color: card.accent }} />
            </div>
            <p className="text-xs font-light text-[#456C8D] flex-1">{card.title}</p>
            <span className="text-lg font-light text-[#131A20] tabular-nums">{card.value}</span>
          </div>
        </Link>
      )}
    </div>);

}