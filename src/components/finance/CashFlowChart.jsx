import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(v || 0);

export default function CashFlowChart({ entries, selectedMonth }) {
  const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
  const monthEnd = endOfMonth(parseISO(selectedMonth + "-01"));
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const data = days.map(day => {
    const dayEntries = entries.filter(e => {
      const ref = e.competence_date || e.due_date;
      if (!ref) return false;
      return isSameDay(parseISO(ref), day);
    });
    const revenue = dayEntries.filter(e => e.type === "revenue").reduce((s, e) => s + (e.amount || 0), 0);
    const expense = dayEntries.filter(e => e.type === "expense").reduce((s, e) => s + (e.amount || 0), 0);
    return {
      day: format(day, "dd/MM"),
      Receitas: revenue,
      Despesas: expense,
    };
  });

  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Fluxo do Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} width={55} />
            <Tooltip formatter={(v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)} />
            <Legend />
            <Area type="monotone" dataKey="Receitas" stroke="#10b981" fill="url(#colorRevenue)" strokeWidth={2} />
            <Area type="monotone" dataKey="Despesas" stroke="#ef4444" fill="url(#colorExpense)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}