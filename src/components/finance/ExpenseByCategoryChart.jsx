import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#131A20", "#456C8D", "#6FA6FF", "#7C9CBF", "#A8C4E5", "#C5D8EF", "#D4E6F8", "#E6EFF8"];
const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function ExpenseByCategoryChart({ entries }) {
  const byCategory = {};
  entries.forEach(e => {
    const cat = e.category || "Sem categoria";
    byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
  });

  const data = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 h-full flex flex-col">
        <h3 className="text-sm font-normal text-[#131A20] mb-1">Por Categoria</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-[#456C8D] font-light">Nenhuma despesa no período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 h-full">
      <h3 className="text-sm font-normal text-[#131A20] mb-1">Despesas por Categoria</h3>
      <p className="text-xs text-[#456C8D] font-light mb-3">Distribuição do período</p>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            formatter={(v) => fmt(v)}
            contentStyle={{
              background: '#fff',
              border: '1px solid #EAEAEA',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 300
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-2">
        {data.slice(0, 5).map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-[#456C8D] font-light truncate max-w-[100px]">{d.name}</span>
            </div>
            <span className="font-normal text-[#131A20]">{fmt(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}