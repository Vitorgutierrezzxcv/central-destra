import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(v || 0);
const fmtFull = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-lg p-3 shadow-md text-xs">
      <p className="text-[#456C8D] font-light mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="font-normal" style={{ color: p.color }}>
          {p.name}: {fmtFull(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function CashFlowChart({ entries, selectedMonth }) {
  const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
  const monthEnd   = endOfMonth(parseISO(selectedMonth + "-01"));
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const data = days.map(day => {
    const dayEntries = entries.filter(e => {
      const ref = e.competence_date || e.due_date;
      if (!ref) return false;
      return isSameDay(parseISO(ref), day);
    });
    const revenue = dayEntries.filter(e => e.type === "revenue").reduce((s, e) => s + (e.amount || 0), 0);
    const expense = dayEntries.filter(e => e.type === "expense").reduce((s, e) => s + (e.amount || 0), 0);
    return { day: format(day, "dd"), Receitas: revenue, Despesas: expense };
  });

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 h-full">
      <h3 className="text-sm font-normal text-[#131A20] mb-1">Fluxo do Mês</h3>
      <p className="text-xs text-[#456C8D] font-light mb-4">Receitas vs. despesas diárias</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: '#456C8D', fontWeight: 300 }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#456C8D', fontWeight: 300 }}
            tickFormatter={fmt}
            width={55}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#456C8D', fontWeight: 300 }}
          />
          <Area
            type="monotone"
            dataKey="Receitas"
            stroke="#456C8D"
            fill="#456C8D"
            fillOpacity={0.08}
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="Despesas"
            stroke="#6FA6FF"
            fill="#6FA6FF"
            fillOpacity={0.08}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}