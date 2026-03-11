import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths, addDays, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Wallet, AlertCircle, CreditCard, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FinancialSummaryCards from "../components/finance/FinancialSummaryCards";
import CashFlowChart from "../components/finance/CashFlowChart";
import ExpenseByCategoryChart from "../components/finance/ExpenseByCategoryChart";
import UpcomingBillsList from "../components/finance/UpcomingBillsList";

export default function FinanceDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
  const monthEnd = endOfMonth(parseISO(selectedMonth + "-01"));

  const { data: entries = [] } = useQuery({
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

  const monthEntries = entries.filter(e => {
    const ref = e.competence_date || e.due_date;
    if (!ref) return false;
    const d = parseISO(ref);
    return !isBefore(d, monthStart) && !isAfter(d, monthEnd);
  });

  const revenues = monthEntries.filter(e => e.type === "revenue");
  const expenses = monthEntries.filter(e => e.type === "expense");

  const totalRevenue = revenues.reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const receivedRevenue = revenues.filter(e => e.status === "received").reduce((s, e) => s + (e.amount || 0), 0);
  const paidExpense = expenses.filter(e => e.status === "paid").reduce((s, e) => s + (e.amount || 0), 0);
  const profit = totalRevenue - totalExpense;

  const pendingPayables = expenses.filter(e => ["pending", "forecast"].includes(e.status));
  const pendingReceivables = revenues.filter(e => ["pending", "forecast"].includes(e.status));

  const today = new Date();
  const overdue = entries.filter(e => {
    if (!e.due_date || ["paid", "received", "cancelled"].includes(e.status)) return false;
    return isBefore(parseISO(e.due_date), today);
  });

  const upcomingDays = 7;
  const upcoming = entries.filter(e => {
    if (!e.due_date || ["paid", "received", "cancelled"].includes(e.status)) return false;
    const d = parseISO(e.due_date);
    return !isBefore(d, today) && isBefore(d, addDays(today, upcomingDays));
  });

  const totalAccountBalance = accounts.filter(a => a.is_active).reduce((s, a) => s + (a.current_balance || 0), 0);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: ptBR }) };
  });

  const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Financeiro</h1>
            <p className="text-slate-500 text-sm mt-1">Visão executiva do financeiro interno</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild className="bg-slate-900 hover:bg-slate-800">
              <Link to={createPageUrl("FinanceEntries")}>+ Lançamento</Link>
            </Button>
          </div>
        </div>

        {/* Alertas */}
        {(overdue.length > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">{overdue.length} lançamento(s) vencido(s)</p>
              <p className="text-sm text-red-600">Total: {fmt(overdue.reduce((s,e) => s + e.amount, 0))}</p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <FinancialSummaryCards
          totalRevenue={totalRevenue}
          totalExpense={totalExpense}
          receivedRevenue={receivedRevenue}
          paidExpense={paidExpense}
          profit={profit}
          totalAccountBalance={totalAccountBalance}
          pendingPayables={pendingPayables.reduce((s, e) => s + (e.amount || 0), 0)}
          pendingReceivables={pendingReceivables.reduce((s, e) => s + (e.amount || 0), 0)}
        />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CashFlowChart entries={entries} selectedMonth={selectedMonth} />
          </div>
          <div>
            <ExpenseByCategoryChart entries={monthEntries.filter(e => e.type === "expense")} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming bills */}
          <UpcomingBillsList entries={upcoming} overdue={overdue} />

          {/* Accounts */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-600" />
                Contas & Saldos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.filter(a => a.is_active).length === 0 && (
                <p className="text-sm text-slate-400">Nenhuma conta cadastrada.</p>
              )}
              {accounts.filter(a => a.is_active).map(acc => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{acc.name}</p>
                    <p className="text-xs text-slate-500">{acc.institution || "Conta"}</p>
                  </div>
                  <span className={`font-bold text-sm ${(acc.current_balance || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {fmt(acc.current_balance)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Total</span>
                <span className={`font-bold ${totalAccountBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {fmt(totalAccountBalance)}
                </span>
              </div>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to={createPageUrl("FinanceAccounts")}>Gerenciar Contas</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}