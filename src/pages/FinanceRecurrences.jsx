import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, RefreshCw, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import FinancialEntryForm from "../components/finance/FinancialEntryForm";
import { useQuery as useQueryA } from "@tanstack/react-query";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const FREQ_LABELS = {
  weekly: "Semanal", biweekly: "Quinzenal", monthly: "Mensal",
  bimonthly: "Bimestral", quarterly: "Trimestral", semiannual: "Semestral", annual: "Anual",
};

export default function FinanceRecurrences() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const qc = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ["financial_entries"],
    queryFn: () => base44.entities.FinancialEntry.list("-created_date", 500),
  });
  const { data: accounts = [] } = useQuery({ queryKey: ["financial_accounts"], queryFn: () => base44.entities.FinancialAccount.list() });
  const { data: cards = [] } = useQuery({ queryKey: ["financial_cards"], queryFn: () => base44.entities.FinancialCard.list() });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => base44.entities.Company.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });

  const recurring = entries.filter(e => e.is_recurring);

  // Group by recurrence_group_id or individual
  const groups = {};
  recurring.forEach(e => {
    const key = e.recurrence_group_id || e.id;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  const groupList = Object.entries(groups).map(([key, items]) => {
    const template = items[0];
    return { key, template, count: items.length, items };
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.FinancialEntry.update(data.id, data)
      : base44.entities.FinancialEntry.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_entries"] }); setShowForm(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialEntry.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial_entries"] }),
  });

  const totalMonthly = groupList.reduce((s, g) => {
    const freq = g.template.recurrence_frequency;
    const amount = g.template.amount || 0;
    const monthly = freq === "weekly" ? amount * 4 : freq === "biweekly" ? amount * 2
      : freq === "monthly" ? amount : freq === "bimonthly" ? amount / 2
      : freq === "quarterly" ? amount / 3 : freq === "semiannual" ? amount / 6
      : freq === "annual" ? amount / 12 : amount;
    return s + monthly;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Recorrências</h1>
            <p className="text-slate-500 text-sm">Lançamentos recorrentes ativos</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />Nova Recorrência
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-5">
              <p className="text-sm text-blue-700 font-medium">Total de Recorrências</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{groupList.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="p-5">
              <p className="text-sm text-red-700 font-medium">Comprometimento Mensal Est.</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{fmt(totalMonthly)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-600 font-medium">Lançamentos Gerados</p>
              <p className="text-3xl font-bold text-slate-700 mt-1">{recurring.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {groupList.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400">Nenhuma recorrência cadastrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupList.map(({ key, template: t, count }) => (
              <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === "revenue" ? "bg-emerald-100" : "bg-red-100"}`}>
                  <RefreshCw className={`w-5 h-5 ${t.type === "revenue" ? "text-emerald-600" : "text-red-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{t.description}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge className="bg-slate-100 text-slate-600 border-none text-xs">{FREQ_LABELS[t.recurrence_frequency] || t.recurrence_frequency}</Badge>
                    {t.category && <Badge className="bg-blue-50 text-blue-600 border-none text-xs">{t.category}</Badge>}
                    {t.cost_center && <Badge className="bg-violet-50 text-violet-600 border-none text-xs">{t.cost_center}</Badge>}
                    <span className="text-xs text-slate-400">{count} ocorrência(s)</span>
                    {t.recurrence_start && <span className="text-xs text-slate-400">desde {format(parseISO(t.recurrence_start), "dd/MM/yyyy")}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-lg ${t.type === "revenue" ? "text-emerald-600" : "text-red-500"}`}>
                    {fmt(t.amount)}
                  </p>
                  <p className="text-xs text-slate-400">por ocorrência</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => { setEditing(t); setShowForm(true); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600" onClick={() => deleteMutation.mutate(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <FinancialEntryForm
          entry={editing ? { ...editing, is_recurring: true } : { is_recurring: true }}
          accounts={accounts}
          cards={cards}
          companies={companies}
          projects={projects}
          onSave={d => saveMutation.mutate(d)}
          onClose={() => { setShowForm(false); setEditing(null); }}
          saving={saveMutation.isPending}
        />
      )}
    </div>
  );
}