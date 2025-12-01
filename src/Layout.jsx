import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FolderKanban, ListTodo, LayoutDashboard, Plus, Package, Building2, ChevronDown, ChevronRight, TrendingUp, PanelLeftClose, PanelLeft, Wallet, ArrowDownCircle, ArrowUpCircle, Target, Repeat } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

import UserProfile from "./components/layout/UserProfile";
import AppSwitcher from "./components/layout/AppSwitcher";

const taskFlowNav = [
  {
    title: "Visão Geral",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Projetos",
    url: createPageUrl("Projects"),
    icon: FolderKanban,
  },
  {
    title: "Tarefas",
    url: createPageUrl("Tasks"),
    icon: ListTodo,
  },
  {
    title: "Tarefas Recorrentes",
    url: createPageUrl("RecurringTasks"),
    icon: Repeat,
  },
  {
    title: "Backlog",
    url: createPageUrl("Backlog"),
    icon: Package,
  },
];

const taskFlowQuickActions = [
  { title: "Novo Projeto", url: createPageUrl("Projects"), icon: Plus, color: "bg-blue-50 hover:bg-blue-100 text-blue-700" },
  { title: "Nova Tarefa", url: createPageUrl("Tasks"), icon: Plus, color: "bg-purple-50 hover:bg-purple-100 text-purple-700" }
];

const crmNav = [
  {
    title: "Cadastro",
    url: createPageUrl("Companies"),
    icon: Building2,
  },
  {
    title: "Oportunidades",
    url: createPageUrl("Opportunities"),
    icon: TrendingUp,
  },
  {
    title: "Prospecção",
    url: createPageUrl("Prospecting"),
    icon: Target,
  },
];

const financeNav = [
  {
    title: "Lançamentos",
    url: createPageUrl("Lancamentos"),
    icon: Wallet,
  },
];

const financeQuickActions = [
  { title: "Nova Entrada", url: createPageUrl("Lancamentos"), icon: ArrowUpCircle, color: "bg-green-50 hover:bg-green-100 text-green-700" },
  { title: "Nova Saída", url: createPageUrl("Lancamentos"), icon: ArrowDownCircle, color: "bg-red-50 hover:bg-red-100 text-red-700" }
];

function LayoutContent({ children }) {
  const location = useLocation();
  const [isTaskFlowOpen, setIsTaskFlowOpen] = useState(false);
  const { open, setOpen } = useSidebar();

  // Determine which module is active based on current page
  const getCurrentModule = () => {
    const path = location.pathname;
    if (path.includes('companies') || path.includes('opportunities') || path.includes('prospecting')) {
      return 'crm';
    }
    if (path.includes('lancamentos')) {
      return 'finance';
    }
    // Check if any taskFlowNav url is present in the path
    if (taskFlowNav.some(item => path.includes(item.url.substring(1)))) {
      return 'taskflow';
    }
    return 'taskflow'; // Default to taskflow if no specific module path matches
  };

  const currentModule = getCurrentModule();

  // Auto-open TaskFlow when in TaskFlow pages and keep it open
  React.useEffect(() => {
    if (currentModule === 'taskflow') {
      setIsTaskFlowOpen(true);
    }
  }, [location.pathname, currentModule]);

  return (
    <>
      <Sidebar className="border-r border-slate-200 bg-white/80 backdrop-blur-sm">
        <SidebarContent className="p-3 flex flex-col h-full">
          {/* AppSwitcher moved to top */}
          <div className="mb-6 px-3">
            <AppSwitcher />
          </div>

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Navegação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {currentModule === 'taskflow' ? (
                  <Collapsible open={isTaskFlowOpen} onOpenChange={setIsTaskFlowOpen}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-all mb-1 group">
                        <div className="flex items-center gap-3">
                          <FolderKanban className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-slate-900">TaskFlow</span>
                        </div>
                        {isTaskFlowOpen ? (
                          <ChevronDown className="w-4 h-4 text-slate-500 transition-transform" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 transition-transform" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-3 mt-1 space-y-1">
                      {taskFlowNav.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              className={`
                                rounded-lg transition-all duration-200
                                ${isActive
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:shadow-lg'
                                  : 'hover:bg-slate-100 text-slate-700'
                                }
                              `}
                            >
                              <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                                <item.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}

                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="px-3 pb-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Ações Rápidas
                          </span>
                        </div>
                        {taskFlowQuickActions.map(action => (
                          <Link
                            key={action.title}
                            to={action.url}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${action.color} transition-colors text-sm font-medium`}
                          >
                            <action.icon className="w-4 h-4" />
                            {action.title}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ) : currentModule === 'crm' ? (
                  <>
                    <div className="px-3 py-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-slate-900">CRM</span>
                      </div>
                    </div>
                    {crmNav.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`
                              rounded-lg mb-1 transition-all duration-200
                              ${isActive
                                ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md hover:shadow-lg'
                                : 'hover:bg-slate-100 text-slate-700'
                              }
                            `}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                          <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-slate-900">Finanças</span>
                      </div>
                    </div>
                    {financeNav.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`
                              rounded-lg mb-1 transition-all duration-200
                              ${isActive
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:shadow-lg'
                                : 'hover:bg-slate-100 text-slate-700'
                              }
                            `}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}

                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="px-3 pb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Ações Rápidas
                        </span>
                      </div>
                      {financeQuickActions.map(action => (
                        <Link
                          key={action.title}
                          to={action.url}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${action.color} transition-colors text-sm font-medium mb-1`}
                        >
                          <action.icon className="w-4 h-4" />
                          {action.title}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* UserProfile at bottom */}
          <div className="mt-auto">
            <UserProfile />
          </div>
        </SidebarContent>
      </Sidebar>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toggle button in header bar - desktop only */}
        <div className="hidden md:flex items-center justify-between bg-white/60 backdrop-blur-sm border-b border-slate-200/50 px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="hover:bg-slate-100 rounded-lg h-9 px-3"
          >
            {open ? (
              <>
                <PanelLeftClose className="w-4 h-4 mr-2 text-slate-700" />
                <span className="text-sm text-slate-700">Ocultar Menu</span>
              </>
            ) : (
              <>
                <PanelLeft className="w-4 h-4 mr-2 text-slate-700" />
                <span className="text-sm text-slate-700">Mostrar Menu</span>
              </>
            )}
          </Button>
          <div className="flex-1" />
        </div>

        {/* Mobile header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-2 py-2 md:hidden sticky top-0 z-10">
          <div className="flex items-center gap-2 w-full max-w-full">
            <SidebarTrigger className="hover:bg-slate-100 p-1.5 rounded-lg transition-colors flex-shrink-0" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <AppSwitcher isMobile={true} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </main>
    </>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-x-hidden">
        <LayoutContent>{children}</LayoutContent>
      </div>
    </SidebarProvider>
  );
}