import React, { useState } from "react";
import PullToRefresh from "../components/mobile/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Filter, TrendingUp, TrendingDown, ArrowLeftRight, SlidersHorizontal, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FinancialEntryForm from "../components/finance/FinancialEntryForm";

const STATUS_LABELS = {
  forecast: { label: "Previsto", color: "bg-slate-100 text-slate-600" },
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-700" },
  paid: { label: "Pago", color: "bg-emerald-100 text-emerald-700" },
  received: { label: "Recebido", color: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "Vencido", color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelado", color: "bg-slate-100 text-slate-500" },
};

const TYPE_ICONS = {
  expense: { icon: TrendingDown, color: "text-red-500", sign: "-" },
  revenue: { icon: TrendingUp, color: "text-emerald-600", sign: "+" },
  transfer: { icon: ArrowLeftRight, color: "text-blue-500", sign: "" },
  adjustment: { icon: SlidersHorizontal, color: "text-purple-500", sign: "" },
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function FinanceEntries() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["financial_entries"],
    queryFn: () => base44.entities.FinancialEntry.list("-created_date", 500),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["financial_accounts"],
    queryFn: () => base44.entities.FinancialAccount.list(),
  });

  const { data: cards = [] } = useQuery({
    queryKey: ["financial_cards"],
    queryFn: () => base44.entities.FinancialCard.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialEntry.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["financial_entries"] });
      const prev = qc.getQueryData(["financial_entries"]);
      qc.setQueryData(["financial_entries"], old => (old || []).filter(e => e.id !== id));
      return { prev };
    },
    onError: (_err, _data, ctx) => qc.setQueryData(["financial_entries"], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["financial_entries"] }),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => data.id
      ? base44.entities.FinancialEntry.update(data.id, data)
      : base44.entities.FinancialEntry.create(data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["financial_entries"] });
      const prev = qc.getQueryData(["financial_entries"]);
      if (data.id) {
        qc.setQueryData(["financial_entries"], old =>
          (old || []).map(e => e.id === data.id ? { ...e, ...data } : e)
        );
      } else {
        const temp = { id: `temp-${Date.now()}`, ...data, created_date: new Date().toISOString() };
        qc.setQueryData(["financial_entries"], old => [temp, ...(old || [])]);
      }
      return { prev };
    },
    onError: (_err, _data, ctx) => qc.setQueryData(["financial_entries"], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["financial_entries"] }),
    onSuccess: () => { setShowForm(false); setEditing(null); },
  });

  const months = [...new Set(entries.map(e => {
    const ref = e.competence_date || e.due_date;
    return ref ? ref.slice(0, 7) : null;
  }).filter(Boolean))].sort().reverse();

  const filtered = entries.filter(e => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterMonth !== "all") {
      const ref = e.competence_date || e.due_date;
      if (!ref || ref.slice(0, 7) !== filterMonth) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (e.description || "").toLowerCase().includes(q)
        || (e.category || "").toLowerCase().includes(q)
        || (e.vendor || "").toLowerCase().includes(q);
    }
    return true;
  });

  const totalFiltered = filtered.reduce((s, e) => {
    const sign = e.type === "revenue" ? 1 : e.type === "expense" ? -1 : 0;
    return s + sign * (e.amount || 0);
  }, 0);

  const handleEdit = (entry) => {
    setEditing(entry);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleRefresh = async () => {
    await qc.invalidateQueries({ queryKey: ["financial_entries"] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lançamentos</h1>
            <p className="text-slate-500 text-sm">Todas as movimentações financeiras</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Novo Lançamento
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar descrição, categoria, fornecedor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
                <SelectItem value="revenue">Receitas</SelectItem>
                <SelectItem value="transfer">Transferências</SelectItem>
                <SelectItem value="adjustment">Ajustes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {months.map(m => (
                  <SelectItem key={m} value={m}>
                    {format(parseISO(m + "-01"), "MMM yyyy", { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">{filtered.length} lançamento(s)</span>
            <span className={`font-semibold ${totalFiltered >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {totalFiltered >= 0 ? "+" : ""}{fmt(totalFiltered)}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400">Nenhum lançamento encontrado.</p>
              <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Novo Lançamento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Categoria</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Vencimento</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">Valor</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => {
                    const typeInfo = TYPE_ICONS[e.type] || TYPE_ICONS.adjustment;
                    const TypeIcon = typeInfo.icon;
                    const status = STATUS_LABELS[e.status] || STATUS_LABELS.pending;
                    return (
                      <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0`}>
                              <TypeIcon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{e.description}</p>
                              {(e.vendor || e.cost_center) && (
                                <p className="text-xs text-slate-400">{e.vendor}{e.vendor && e.cost_center ? " • " : ""}{e.cost_center}</p>
                              )}
                              {(e.is_recurring || e.is_installment) && (
                                <div className="flex gap-1 mt-0.5">
                                  {e.is_recurring && <Badge className="bg-blue-50 text-blue-600 border-none text-[10px] px-1 py-0">Recorrente</Badge>}
                                  {e.is_installment && <Badge className="bg-purple-50 text-purple-600 border-none text-[10px] px-1 py-0">{e.installment_number}/{e.installment_total}x</Badge>}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-600 text-xs">{e.category || "—"}</span>
                          {e.subcategory && <p className="text-xs text-slate-400">{e.subcategory}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {e.due_date ? format(parseISO(e.due_date), "dd/MM/yyyy") : "—"}
                          {e.competence_date && e.competence_date !== e.due_date && (
                            <p className="text-slate-400">Comp: {format(parseISO(e.competence_date), "dd/MM/yyyy")}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${status.color} border-none text-xs`}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${typeInfo.color}`}>
                            {typeInfo.sign}{fmt(e.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handleEdit(e)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="w-8 h-8 text-red-400 hover:text-red-600" onClick={() => deleteMutation.mutate(e.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      {showForm && (
        <FinancialEntryForm
          entry={editing}
          accounts={accounts}
          cards={cards}
          companies={companies}
          projects={projects}
          onSave={(data) => saveMutation.mutate(data)}
          onClose={handleClose}
          saving={saveMutation.isPending}
        />
      )}
    </div>
    </PullToRefresh>
  );
}