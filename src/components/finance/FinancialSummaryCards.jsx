import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function FinancialSummaryCards({
  totalRevenue, totalExpense, receivedRevenue, paidExpense,
  profit, totalAccountBalance, pendingPayables, pendingReceivables
}) {
  const cards = [
    {
      label: "Receitas do Mês",
      value: fmt(totalRevenue),
      sub: `${fmt(receivedRevenue)} recebido`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Despesas do Mês",
      value: fmt(totalExpense),
      sub: `${fmt(paidExpense)} pago`,
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-100",
    },
    {
      label: "Resultado",
      value: fmt(profit),
      sub: profit >= 0 ? "Superávit" : "Déficit",
      icon: profit >= 0 ? ArrowUpRight : ArrowDownRight,
      color: profit >= 0 ? "text-emerald-600" : "text-red-500",
      bg: profit >= 0 ? "bg-emerald-50" : "bg-red-50",
      border: profit >= 0 ? "border-emerald-100" : "border-red-100",
    },
    {
      label: "Saldo em Contas",
      value: fmt(totalAccountBalance),
      sub: "Saldo atual",
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "A Pagar",
      value: fmt(pendingPayables),
      sub: "Previsto",
      icon: ArrowDownRight,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
    },
    {
      label: "A Receber",
      value: fmt(pendingReceivables),
      sub: "Previsto",
      icon: Clock,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className={`border ${c.border} shadow-sm`}>
            <CardContent className="p-4">
              <div className={`w-8 h-8 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className={`font-bold text-sm ${c.color}`}>{c.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}