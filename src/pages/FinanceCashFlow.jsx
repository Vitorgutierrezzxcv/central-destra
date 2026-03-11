import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtCompact = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(v || 0);

export default function FinanceCashFlow() {
  const [months, setMonths] = useState("6");

  const { data: entries = [] } = useQuery({
    queryKey: ["financial_entries"],
    queryFn: () => base44.entities.FinancialEntry.list("-created_date", 1000),
  });

  const numMonths = parseInt(months);
  const monthList = eachMonthOfInterval({
    start: subMonths(new Date(), Math.floor(numMonths / 2)),
    end: addMonths(new Date(), Math.ceil(numMonths / 2)),
  }).slice(0, numMonths);

  const data = monthList.map(m => {
    const start = startOfMonth(m);
    const end = endOfMonth(m);
    const monthEntries = entries.filter(e => {
      const ref = e.competence_date || e.due_date;
      if (!ref) return false;
      const d = parseISO(ref);
      return !isBefore(d, start) && !isAfter(d, end);
    });
    const revenues = monthEntries.filter(e => e.type === "revenue");
    const expenses = monthEntries.filter(e => e.type === "expense");
    const totalRev = revenues.reduce((s, e) => s + (e.amount || 0), 0);
    const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const receivedRev = revenues.filter(e => e.status === "received").reduce((s, e) => s + (e.amount || 0), 0);
    const paidExp = expenses.filter(e => e.status === "paid").reduce((s, e) => s + (e.amount || 0), 0);
    return {
      month: format(m, "MMM/yy", { locale: ptBR }),
      "Receitas Previstas": totalRev,
      "Despesas Previstas": totalExp,
      "Receitas Realizadas": receivedRev,
      "Despesas Realizadas": paidExp,
      "Resultado": totalRev - totalExp,
      isFuture: isAfter(m, new Date()),
    };
  });

  const totals = data.reduce((acc, d) => ({
    revenues: acc.revenues + d["Receitas Previstas"],
    expenses: acc.expenses + d["Despesas Previstas"],
    realized: acc.realized + d["Receitas Realizadas"] - d["Despesas Realizadas"],
  }), { revenues: 0, expenses: 0, realized: 0 });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Fluxo de Caixa</h1>
            <p className="text-slate-500 text-sm">Projeção e histórico financeiro</p>
          </div>
          <Select value={months} onValueChange={setMonths}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-emerald-50">
            <CardContent className="p-5">
              <p className="text-sm text-emerald-700 font-medium">Total Receitas (período)</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{fmt(totals.revenues)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="p-5">
              <p className="text-sm text-red-700 font-medium">Total Despesas (período)</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{fmt(totals.expenses)}</p>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${totals.realized >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
            <CardContent className="p-5">
              <p className={`text-sm font-medium ${totals.realized >= 0 ? "text-blue-700" : "text-orange-700"}`}>Resultado Realizado</p>
              <p className={`text-2xl font-bold mt-1 ${totals.realized >= 0 ? "text-blue-700" : "text-orange-700"}`}>{fmt(totals.realized)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Receitas vs Despesas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtCompact} width={65} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Bar dataKey="Receitas Previstas" fill="#10b98133" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas Previstas" fill="#ef444433" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Receitas Realizadas" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Despesas Realizadas" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Month Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tabela por Mês</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Mês</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Receitas</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Despesas</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Resultado</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <tr key={i} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{d.month}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{fmt(d["Receitas Previstas"])}</td>
                      <td className="px-4 py-3 text-right text-red-500 font-medium">{fmt(d["Despesas Previstas"])}</td>
                      <td className={`px-4 py-3 text-right font-bold ${d["Resultado"] >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {fmt(d["Resultado"])}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={d.isFuture ? "bg-blue-100 text-blue-600 border-none" : "bg-slate-100 text-slate-600 border-none"}>
                          {d.isFuture ? "Previsto" : "Histórico"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}