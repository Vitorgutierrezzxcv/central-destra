import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#3b82f6","#ec4899","#14b8a6","#f97316","#84cc16"];

function groupBy(arr, key, valueKey) {
  const result = {};
  arr.forEach(item => {
    const k = item[key] || "Outros";
    result[k] = (result[k] || 0) + (item[valueKey] || 0);
  });
  return Object.entries(result).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export default function FinanceReports() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [tab, setTab] = useState("categories");

  const { data: entries = [] } = useQuery({
    queryKey: ["financial_entries"],
    queryFn: () => base44.entities.FinancialEntry.list("-created_date", 500),
  });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });

  const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
  const monthEnd = endOfMonth(parseISO(selectedMonth + "-01"));
  const monthEntries = entries.filter(e => {
    const ref = e.competence_date || e.due_date;
    if (!ref) return false;
    const d = parseISO(ref);
    return !isBefore(d, monthStart) && !isAfter(d, monthEnd);
  });

  const expenses = monthEntries.filter(e => e.type === "expense");
  const revenues = monthEntries.filter(e => e.type === "revenue");

  const byCategory = groupBy(expenses, "category", "amount");
  const byCostCenter = groupBy(expenses, "cost_center", "amount");
  const byVendor = groupBy(expenses, "vendor", "amount");
  const byClient = groupBy(revenues, "company_id", "amount").map(r => ({
    ...r,
    name: companies.find(c => c.id === r.name)?.name || r.name || "Outros",
  }));

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: ptBR }) };
  });

  const exportCSV = (data, filename) => {
    const csv = [["Nome", "Valor"], ...data.map(d => [d.name, d.value.toFixed(2)])].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const ReportChart = ({ data, title, filename, color = "#6366f1" }) => (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={() => exportCSV(data, filename)}>
          <Download className="w-3.5 h-3.5 mr-1" />CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-slate-400 text-sm py-6 text-center">Nenhum dado no período</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1.5">
              {data.slice(0, 6).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-600 truncate max-w-[160px]">{d.name}</span>
                  </div>
                  <span className="font-medium text-slate-700">{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Relatórios Financeiros</h1>
            <p className="text-slate-500 text-sm">Análises e exportações</p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Receitas", value: revenues.reduce((s,e) => s + (e.amount||0), 0), color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Despesas", value: expenses.reduce((s,e) => s + (e.amount||0), 0), color: "text-red-600", bg: "bg-red-50" },
            { label: "Resultado", value: revenues.reduce((s,e) => s + (e.amount||0), 0) - expenses.reduce((s,e) => s + (e.amount||0), 0), color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Lançamentos", value: monthEntries.length, color: "text-slate-700", bg: "bg-slate-100", isCount: true },
          ].map(c => (
            <Card key={c.label} className={`border-0 shadow-sm ${c.bg}`}>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.isCount ? c.value : fmt(c.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="categories">Por Categoria</TabsTrigger>
            <TabsTrigger value="cost_centers">Por Centro de Custo</TabsTrigger>
            <TabsTrigger value="vendors">Por Fornecedor</TabsTrigger>
            <TabsTrigger value="clients">Por Cliente</TabsTrigger>
          </TabsList>
          <TabsContent value="categories" className="mt-4">
            <ReportChart data={byCategory} title="Despesas por Categoria" filename="despesas-categoria" />
          </TabsContent>
          <TabsContent value="cost_centers" className="mt-4">
            <ReportChart data={byCostCenter} title="Despesas por Centro de Custo" filename="despesas-centro-custo" color="#8b5cf6" />
          </TabsContent>
          <TabsContent value="vendors" className="mt-4">
            <ReportChart data={byVendor} title="Despesas por Fornecedor" filename="despesas-fornecedor" color="#f59e0b" />
          </TabsContent>
          <TabsContent value="clients" className="mt-4">
            <ReportChart data={byClient} title="Receitas por Cliente" filename="receitas-cliente" color="#10b981" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}