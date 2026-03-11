import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths, addDays, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FinancialSummaryCards from "../components/finance/FinancialSummaryCards";
import CashFlowChart from "../components/finance/CashFlowChart";
import ExpenseByCategoryChart from "../components/finance/ExpenseByCategoryChart";
import UpcomingBillsList from "../components/finance/UpcomingBillsList";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export default function FinanceDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const monthStart = startOfMonth(parseISO(selectedMonth + "-01"));
  const monthEnd   = endOfMonth(parseISO(selectedMonth + "-01"));

  const { data: entries = [] } = useQuery({
    queryKey: ["financial_entries"],
    queryFn: () => base44.entities.FinancialEntry.list("-created_date", 500),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["financial_accounts"],
    queryFn: () => base44.entities.FinancialAccount.list(),
  });

  const monthEntries = entries.filter(e => {
    const ref = e.competence_date || e.due_date;
    if (!ref) return false;
    const d = parseISO(ref);
    return !isBefore(d, monthStart) && !isAfter(d, monthEnd);
  });

  const revenues = monthEntries.filter(e => e.type === "revenue");
  const expenses = monthEntries.filter(e => e.type === "expense");

  const totalRevenue      = revenues.reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpense      = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const receivedRevenue   = revenues.filter(e => e.status === "received").reduce((s, e) => s + (e.amount || 0), 0);
  const paidExpense       = expenses.filter(e => e.status === "paid").reduce((s, e) => s + (e.amount || 0), 0);
  const profit            = totalRevenue - totalExpense;

  const pendingPayables   = expenses.filter(e => ["pending", "forecast"].includes(e.status));
  const pendingReceivables = revenues.filter(e => ["pending", "forecast"].includes(e.status));

  const today   = new Date();
  const overdue = entries.filter(e => {
    if (!e.due_date || ["paid", "received", "cancelled"].includes(e.status)) return false;
    return isBefore(parseISO(e.due_date), today);
  });

  const upcoming = entries.filter(e => {
    if (!e.due_date || ["paid", "received", "cancelled"].includes(e.status)) return false;
    const d = parseISO(e.due_date);
    return !isBefore(d, today) && isBefore(d, addDays(today, 7));
  });

  const totalAccountBalance = accounts.filter(a => a.is_active).reduce((s, a) => s + (a.current_balance || 0), 0);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: ptBR }) };
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#456C8D] font-light mb-1 uppercase tracking-wider">Módulo</p>
            <h1 className="text-2xl font-normal text-[#131A20] tracking-tight">Dashboard Financeiro</h1>
            <p className="text-sm text-[#456C8D] font-light mt-1">Visão executiva do financeiro interno</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-44 h-9 border-[#EAEAEA] text-sm font-light text-[#131A20] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value} className="text-sm font-light capitalize">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild size="sm" className="h-9 bg-[#6FA6FF] hover:bg-[#456C8D] text-white border-0 rounded-lg font-normal text-sm">
              <Link to={createPageUrl("FinanceEntries")}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Lançamento
              </Link>
            </Button>
          </div>
        </div>

        {/* Alert */}
        {overdue.length > 0 && (
          <div className="bg-[#FEF0EE] border border-[#EAEAEA] rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-[#C0392B] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-normal text-[#131A20]">
                {overdue.length} lançamento{overdue.length !== 1 ? 's' : ''} vencido{overdue.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[#456C8D] font-light mt-0.5">Total: {fmt(overdue.reduce((s,e) => s + e.amount, 0))}</p>
            </div>
          </div>
        )}

        {/* KPIs */}
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <CashFlowChart entries={entries} selectedMonth={selectedMonth} />
          </div>
          <div>
            <ExpenseByCategoryChart entries={monthEntries.filter(e => e.type === "expense")} />
          </div>
        </div>

        {/* Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <UpcomingBillsList entries={upcoming} overdue={overdue} />

          {/* Accounts */}
          <div className="bg-white border border-[#EAEAEA] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#EAEAEA] rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-[#131A20]" />
                </div>
                <div>
                  <h3 className="text-sm font-normal text-[#131A20]">Contas & Saldos</h3>
                  <p className="text-xs text-[#456C8D] font-light">{accounts.filter(a => a.is_active).length} ativas</p>
                </div>
              </div>
              <Link to={createPageUrl("FinanceAccounts")}>
                <button className="text-xs text-[#6FA6FF] hover:text-[#456C8D] flex items-center gap-1 transition-colors font-light">
                  Gerenciar
                  <ArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {accounts.filter(a => a.is_active).length === 0 ? (
              <p className="text-sm text-[#456C8D] font-light py-4 text-center">Nenhuma conta cadastrada</p>
            ) : (
              <div className="space-y-2">
                {accounts.filter(a => a.is_active).map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-3 bg-[#F8F9FB] border border-[#EAEAEA] rounded-lg">
                    <div>
                      <p className="text-sm font-normal text-[#131A20]">{acc.name}</p>
                      <p className="text-xs text-[#456C8D] font-light">{acc.institution || "Conta"}</p>
                    </div>
                    <span className={`text-sm font-normal ${(acc.current_balance || 0) >= 0 ? 'text-[#2D6A4F]' : 'text-[#C0392B]'}`}>
                      {fmt(acc.current_balance)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between">
                  <span className="text-xs text-[#456C8D] font-light">Saldo total</span>
                  <span className={`text-sm font-normal ${totalAccountBalance >= 0 ? 'text-[#2D6A4F]' : 'text-[#C0392B]'}`}>
                    {fmt(totalAccountBalance)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}