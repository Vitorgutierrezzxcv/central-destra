import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FolderKanban, ListTodo, LayoutDashboard, Plus, Package,
  Building2, ChevronDown, ChevronRight, BarChart2, Wallet,
  Target, FileText, Store, Users, Home
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import UserProfile from "./components/layout/UserProfile";
import AppSwitcher from "./components/layout/AppSwitcher";

const taskFlowNav = [
  { title: "Visão Geral", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "Projetos",    url: createPageUrl("Projects"),  icon: FolderKanban },
  { title: "Tarefas",     url: createPageUrl("Tasks"),     icon: ListTodo },
  { title: "Backlog",     url: createPageUrl("Backlog"),   icon: Package },
];

const financeNav = [
  { title: "Dashboard",        url: createPageUrl("FinanceDashboard"),     icon: LayoutDashboard },
  { title: "Lançamentos",      url: createPageUrl("FinanceEntries"),       icon: ListTodo },
  { title: "Fluxo de Caixa",   url: createPageUrl("FinanceCashFlow"),      icon: BarChart2 },
  { title: "Recorrências",     url: createPageUrl("FinanceRecurrences"),   icon: Target },
  { title: "Contas & Cartões", url: createPageUrl("FinanceAccounts"),      icon: Wallet },
  { title: "Relatórios",       url: createPageUrl("FinanceReports"),       icon: FileText },
  { title: "Fechamento",       url: createPageUrl("FinanceMonthlyClosing"),icon: Store },
];

const crmNav = [
  { title: "Empresas", url: createPageUrl("Companies"), icon: Building2 },
];

function NavItem({ item, isActive }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className={`
        rounded-lg mb-0.5 transition-all duration-150 h-9
        ${isActive
          ? 'bg-[#6FA6FF] text-white'
          : 'text-[#456C8D] hover:bg-[#EAEAEA] hover:text-[#131A20]'}
      `}>
        <Link to={item.url} className="flex items-center gap-3 px-3">
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-normal">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isTaskFlowOpen, setIsTaskFlowOpen] = useState(true);

  const isInFinance = location.pathname.toLowerCase().includes('finance') || location.pathname.toLowerCase().includes('lancamentos');
  const isInCRM = location.pathname.toLowerCase().includes('companies') || location.pathname.toLowerCase().includes('opportunit');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#F8F9FB]" style={{ fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Inter, sans-serif)' }}>
        {/* Sidebar */}
        <Sidebar className="border-r border-[#EAEAEA] bg-white hidden md:flex w-60">
          <SidebarContent className="px-3 py-4 flex flex-col h-full gap-0">

            {/* Logo */}
            <div className="px-3 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#131A20] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">D</span>
                </div>
                <div>
                  <p className="text-[#131A20] text-sm font-semibold leading-tight">Central Destra</p>
                  <p className="text-[#456C8D] text-[10px] font-light">Sistema de Gestão</p>
                </div>
              </div>
            </div>

            <SidebarGroup className="flex-1">
              <SidebarGroupContent>
                <SidebarMenu>

                  {/* Finance Nav */}
                  {isInFinance && financeNav.map(item => (
                    <NavItem key={item.title} item={item} isActive={location.pathname === item.url} />
                  ))}

                  {/* TaskFlow Nav */}
                  {!isInFinance && !isInCRM && (
                    <Collapsible open={isTaskFlowOpen} onOpenChange={setIsTaskFlowOpen}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between px-3 h-9 rounded-lg hover:bg-[#EAEAEA] transition-colors mb-0.5 group">
                          <div className="flex items-center gap-3">
                            <FolderKanban className="w-4 h-4 text-[#456C8D]" />
                            <span className="text-sm font-normal text-[#131A20]">TaskFlow</span>
                          </div>
                          {isTaskFlowOpen
                            ? <ChevronDown className="w-3.5 h-3.5 text-[#456C8D]" />
                            : <ChevronRight className="w-3.5 h-3.5 text-[#456C8D]" />
                          }
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-3 space-y-0">
                        {taskFlowNav.map(item => (
                          <NavItem key={item.title} item={item} isActive={location.pathname === item.url} />
                        ))}
                        <div className="mt-2 pt-2 border-t border-[#EAEAEA]">
                          <Link to={createPageUrl("Projects")} className="flex items-center gap-2 px-3 h-8 rounded-lg text-[#6FA6FF] hover:bg-[#6FA6FF]/8 transition-colors text-xs font-normal">
                            <Plus className="w-3.5 h-3.5" />
                            Novo Projeto
                          </Link>
                          <Link to={createPageUrl("Tasks")} className="flex items-center gap-2 px-3 h-8 rounded-lg text-[#456C8D] hover:bg-[#EAEAEA] transition-colors text-xs font-normal">
                            <Plus className="w-3.5 h-3.5" />
                            Nova Tarefa
                          </Link>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* CRM Nav */}
                  {isInCRM && crmNav.map(item => (
                    <NavItem key={item.title} item={item} isActive={location.pathname === item.url} />
                  ))}

                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Bottom */}
            <div className="space-y-2 pt-4 border-t border-[#EAEAEA]">
              <div className="px-1">
                <AppSwitcher />
              </div>
              <UserProfile />
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="bg-white border-b border-[#EAEAEA] px-4 py-3 md:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <SidebarTrigger className="hover:bg-[#EAEAEA] p-2 rounded-lg transition-colors" />
              <AppSwitcher isMobile={true} />
              <div className="w-10" />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}