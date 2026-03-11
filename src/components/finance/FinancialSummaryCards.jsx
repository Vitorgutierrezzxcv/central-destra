import React from "react";
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
      accent: "#456C8D",
      bg: "#F0F4F8",
    },
    {
      label: "Despesas do Mês",
      value: fmt(totalExpense),
      sub: `${fmt(paidExpense)} pago`,
      icon: TrendingDown,
      accent: "#C0392B",
      bg: "#FEF0EE",
    },
    {
      label: "Resultado",
      value: fmt(profit),
      sub: profit >= 0 ? "Superávit" : "Déficit",
      icon: profit >= 0 ? ArrowUpRight : ArrowDownRight,
      accent: profit >= 0 ? "#2D6A4F" : "#C0392B",
      bg: profit >= 0 ? "#EAF5EE" : "#FEF0EE",
    },
    {
      label: "Saldo em Contas",
      value: fmt(totalAccountBalance),
      sub: "Saldo atual",
      icon: Wallet,
      accent: "#131A20",
      bg: "#EAEAEA",
    },
    {
      label: "A Pagar",
      value: fmt(pendingPayables),
      sub: "Previsto",
      icon: ArrowDownRight,
      accent: "#456C8D",
      bg: "#F0F4F8",
    },
    {
      label: "A Receber",
      value: fmt(pendingReceivables),
      sub: "Previsto",
      icon: Clock,
      accent: "#6FA6FF",
      bg: "#EBF3FF",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-white border border-[#EAEAEA] rounded-xl p-4 hover:border-[#6FA6FF]/30 transition-all">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: c.bg }}>
              <Icon className="w-4 h-4" style={{ color: c.accent }} />
            </div>
            <p className="text-xs text-[#456C8D] font-light mb-1">{c.label}</p>
            <p className="text-sm font-normal text-[#131A20]" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.value}</p>
            <p className="text-[10px] text-[#456C8D] font-light mt-0.5">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}