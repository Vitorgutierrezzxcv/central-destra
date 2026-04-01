import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu, X, LayoutDashboard, FolderKanban, ListTodo, Package, Repeat,
  Target, TrendingUp, Building2, FileText, PieChart, Receipt, BarChart2,
  CreditCard, Wallet, Users, DollarSign, Clock, UserCog, ExternalLink,
  LogOut, Pencil, Plus
} from "lucide-react";

const navSections = [
  {
    label: "Task Flow",
    items: [
      { title: "Visão Geral",   url: createPageUrl("Dashboard"),     icon: LayoutDashboard },
      { title: "Projetos",      url: createPageUrl("Projects"),       icon: FolderKanban },
      { title: "Tarefas",       url: createPageUrl("Tasks"),          icon: ListTodo },
      { title: "Backlog",       url: createPageUrl("Backlog"),        icon: Package },
      { title: "Recorrentes",   url: createPageUrl("RecurringTasks"), icon: Repeat },
    ],
  },
  {
    label: "CRM",
    items: [
      { title: "Empresas",      url: createPageUrl("Companies"),      icon: Building2 },
      { title: "Oportunidades", url: createPageUrl("Opportunities"),  icon: Target },
      { title: "Prospecção",    url: createPageUrl("Prospecting"),    icon: TrendingUp },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Dashboard",          url: createPageUrl("FinanceDashboard"),        icon: PieChart },
      { title: "Lançamentos",        url: createPageUrl("FinanceEntries"),           icon: Receipt },
      { title: "Relatórios",         url: createPageUrl("FinanceReports"),           icon: BarChart2 },
      { title: "Fluxo de Caixa",     url: createPageUrl("FinanceCashFlow"),          icon: TrendingUp },
      { title: "Gastos Fixos",       url: createPageUrl("FinanceFixedExpenses"),     icon: CreditCard },
      { title: "Gastos Variáveis",   url: createPageUrl("FinanceVariableExpenses"),  icon: Wallet },
      { title: "Folha de Pagamento", url: createPageUrl("FinancePayroll"),           icon: Users },
      { title: "Contas",             url: createPageUrl("FinanceAccounts"),          icon: DollarSign },
      { title: "Fechamento",         url: createPageUrl("FinanceMonthlyClosing"),    icon: Clock },
    ],
  },
  {
    label: "Central do Cliente",
    items: [
      { title: "Gestão de Acessos",     url: createPageUrl("ClientPortalAdmin"), icon: UserCog },
      { title: "Abrir Portal do Cliente", url: createPageUrl("ClientPortalLogin"), icon: ExternalLink },
    ],
  },
  {
    label: "Outros",
    items: [
      { title: "Páginas / Wiki", url: createPageUrl("Pages"), icon: FileText },
    ],
  },
];

const quickActions = [
  { title: "Novo Projeto", url: createPageUrl("Projects"), icon: Plus },
  { title: "Nova Tarefa",  url: createPageUrl("Tasks"),    icon: Plus },
];

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const displayName = user?.display_name || user?.full_name || "Usuário";
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#131A20] hover:bg-[#1e2a35] text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
        aria-label="Menu"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Drawer Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 origin-bottom-right ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header — user info */}
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <Avatar className="w-10 h-10 border-2 border-slate-200 flex-shrink-0">
              {user.profile_photo_url ? <AvatarImage src={user.profile_photo_url} /> : null}
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto">
          {navSections.map(section => (
            <div key={section.label} className="py-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 pt-2 pb-1">
                {section.label}
              </p>
              {section.items.map(item => {
                const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "?");
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 px-4 py-3">
          <button
            onClick={() => { base44.auth.logout(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-[#131A20] text-white text-sm font-medium hover:bg-[#1e2a35] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </>
  );
}