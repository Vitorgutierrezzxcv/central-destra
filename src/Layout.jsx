import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FolderKanban, ListTodo, LayoutDashboard, Plus, Package, Building2,
  ChevronDown, ChevronRight, DollarSign, TrendingUp, CreditCard, FileText,
  Users, BarChart2, Repeat, Wallet, PieChart, Receipt, UserCog, ExternalLink,
  Target, Clock
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import UserProfile from "./components/layout/UserProfile";
import AppSwitcher from "./components/layout/AppSwitcher";

const navCategories = [
  {
    label: "Interno",
    color: "text-blue-600",
    borderColor: "border-blue-100",
    items: [
      { title: "Visão Geral",    url: createPageUrl("Dashboard"),       icon: LayoutDashboard },
      { title: "Projetos",       url: createPageUrl("Projects"),         icon: FolderKanban },
      { title: "Tarefas",        url: createPageUrl("Tasks"),            icon: ListTodo },
      { title: "Backlog",        url: createPageUrl("Backlog"),          icon: Package },
      { title: "Recorrentes",    url: createPageUrl("RecurringTasks"),   icon: Repeat },
      { title: "Oportunidades",  url: createPageUrl("Opportunities"),    icon: Target },
      { title: "Prospecção",     url: createPageUrl("Prospecting"),      icon: TrendingUp },
      { title: "CRM / Empresas", url: createPageUrl("Companies"),        icon: Building2 },
      { title: "Páginas",        url: createPageUrl("Pages"),            icon: FileText },
    ],
  },
  {
    label: "Financeiro",
    color: "text-emerald-600",
    borderColor: "border-emerald-100",
    items: [
      { title: "Dashboard",         url: createPageUrl("FinanceDashboard"),       icon: PieChart },
      { title: "Lançamentos",       url: createPageUrl("FinanceEntries"),          icon: Receipt },
      { title: "Resumo",            url: createPageUrl("FinanceSummary"),          icon: BarChart2 },
      { title: "Fluxo de Caixa",    url: createPageUrl("FinanceCashFlow"),         icon: TrendingUp },
      { title: "Gastos Fixos",      url: createPageUrl("FinanceFixedExpenses"),    icon: CreditCard },
      { title: "Gastos Variáveis",  url: createPageUrl("FinanceVariableExpenses"), icon: Wallet },
      { title: "Folha de Pagamento",url: createPageUrl("FinancePayroll"),          icon: Users },
      { title: "Contas",            url: createPageUrl("FinanceAccounts"),         icon: DollarSign },
      { title: "Recorrências",      url: createPageUrl("FinanceRecurrences"),      icon: Repeat },
      { title: "Relatórios",        url: createPageUrl("FinanceReports"),          icon: BarChart2 },
      { title: "Fechamento",        url: createPageUrl("FinanceMonthlyClosing"),   icon: Clock },
    ],
  },
  {
    label: "Central do Cliente",
    color: "text-purple-600",
    borderColor: "border-purple-100",
    items: [
      { title: "Gestão de Acessos", url: createPageUrl("ClientPortalAdmin"), icon: UserCog },
    ],
    extra: [
      {
        title: "Abrir Portal do Cliente",
        url: createPageUrl("ClientPortalLogin"),
        icon: ExternalLink,
        color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
      },
    ],
  },
];

const quickActions = [
  { title: "Novo Projeto", url: createPageUrl("Projects"), icon: Plus, color: "bg-blue-50 hover:bg-blue-100 text-blue-700" },
  { title: "Nova Tarefa",  url: createPageUrl("Tasks"),    icon: Plus, color: "bg-purple-50 hover:bg-purple-100 text-purple-700" },
];

function NavCategory({ category, location }) {
  const hasActive = category.items.some(i => location.pathname === i.url);
  const [open, setOpen] = useState(hasActive);

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [location.pathname]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 transition-all mt-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${category.color}`}>
            {category.label}
          </span>
          {open
            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={`ml-1 border-l-2 ${category.borderColor} pl-2 mt-1 space-y-0.5`}>
          {category.items.map(item => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={`rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          {(category.extra || []).map(action => (
            <Link
              key={action.title}
              to={action.url}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${action.color} transition-colors text-sm font-medium mt-1`}
            >
              <action.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{action.title}</span>
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isMainOpen, setIsMainOpen] = useState(true);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-slate-200 bg-white/80 backdrop-blur-sm hidden md:flex">
          <SidebarContent className="p-3 flex flex-col h-full overflow-hidden">
            <SidebarGroup className="flex-1 overflow-hidden flex flex-col min-h-0">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 flex-shrink-0">
                Navegação
              </SidebarGroupLabel>
              <SidebarGroupContent className="flex-1 overflow-hidden">
                <SidebarMenu>
                  <Collapsible open={isMainOpen} onOpenChange={setIsMainOpen}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-all mb-1">
                        <div className="flex items-center gap-3">
                          <FolderKanban className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-slate-900">Central Destra</span>
                        </div>
                        {isMainOpen
                          ? <ChevronDown className="w-4 h-4 text-slate-500" />
                          : <ChevronRight className="w-4 h-4 text-slate-500" />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div
                        className="ml-3 mt-1 overflow-y-auto pr-1"
                        style={{ maxHeight: "calc(100vh - 200px)" }}
                      >
                        {navCategories.map(cat => (
                          <NavCategory key={cat.label} category={cat} location={location} />
                        ))}
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="px-2 pb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              Ações Rápidas
                            </span>
                          </div>
                          {quickActions.map(action => (
                            <Link
                              key={action.title}
                              to={action.url}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${action.color} transition-colors text-sm font-medium mb-0.5`}
                            >
                              <action.icon className="w-4 h-4" />
                              {action.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto space-y-3 flex-shrink-0">
              <div className="px-3">
                <AppSwitcher />
              </div>
              <UserProfile />
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 md:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors" />
              <AppSwitcher isMobile={true} />
              <div className="w-10" />
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}