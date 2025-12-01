import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FolderKanban, ListTodo, LayoutDashboard, Plus, Package, Building2, ChevronDown, ChevronRight, TrendingUp, PanelLeftClose, PanelLeft, Wallet, ArrowDownCircle, ArrowUpCircle, Target, Repeat, Menu, X } from "lucide-react";
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

import UserProfile from "./components/layout/UserProfile";
import AppSwitcher from "./components/layout/AppSwitcher";
import { useUserAccess } from "./components/layout/AccessGuard";

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

const crmNavBase = [
  {
    title: "Cadastro",
    url: createPageUrl("Companies"),
    icon: Building2,
    module: "crm",
  },
  {
    title: "Oportunidades",
    url: createPageUrl("Opportunities"),
    icon: TrendingUp,
    module: "crm",
  },
  {
    title: "Prospecção",
    url: createPageUrl("Prospecting"),
    icon: Target,
    module: "prospecting",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { open, setOpen } = useSidebar();
  const { canAccess, hasFullAccess } = useUserAccess();

  // Filter CRM nav based on access
  const crmNav = crmNavBase.filter(item => canAccess(item.module));

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
      <Sidebar className="border-r border-[#EAEAEA] bg-white">
        <SidebarContent className="p-3 flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="md:hidden flex justify-end mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-700" />
            </Button>
          </div>
          
          {/* AppSwitcher moved to top */}
          <div className="mb-6 px-3">
            <AppSwitcher />
          </div>

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-[#456C8D] uppercase tracking-wider px-3 py-2">
              Navegação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {currentModule === 'taskflow' ? (
                  <Collapsible open={isTaskFlowOpen} onOpenChange={setIsTaskFlowOpen}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#EAEAEA] transition-all mb-1 group">
                        <div className="flex items-center gap-3">
                          <FolderKanban className="w-5 h-5 text-[#6FA6FF]" />
                          <span className="font-medium text-[#131A20]">TaskFlow</span>
                        </div>
                        {isTaskFlowOpen ? (
                          <ChevronDown className="w-4 h-4 text-[#456C8D] transition-transform" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#456C8D] transition-transform" />
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
                                  ? 'bg-[#6FA6FF] text-white'
                                  : 'hover:bg-[#EAEAEA] text-[#131A20]'
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

                      <div className="mt-3 pt-3 border-t border-[#EAEAEA]">
                        <div className="px-3 pb-2">
                          <span className="text-xs font-medium text-[#456C8D] uppercase tracking-wider">
                            Ações Rápidas
                          </span>
                        </div>
                        {taskFlowQuickActions.map(action => (
                          <Link
                            key={action.title}
                            to={action.url}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EAEAEA] hover:bg-[#6FA6FF] hover:text-white transition-colors text-sm font-medium text-[#131A20] mb-1"
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
                        <div className="w-10 h-10 bg-[#6FA6FF] rounded-xl flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-[#131A20]">CRM</span>
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
                                ? 'bg-[#6FA6FF] text-white'
                                : 'hover:bg-[#EAEAEA] text-[#131A20]'
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
                          <div className="w-10 h-10 bg-[#456C8D] rounded-xl flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-[#131A20]">Finanças</span>
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
                                ? 'bg-[#456C8D] text-white'
                                : 'hover:bg-[#EAEAEA] text-[#131A20]'
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

                          <div className="mt-3 pt-3 border-t border-[#EAEAEA]">
                          <div className="px-3 pb-2">
                          <span className="text-xs font-medium text-[#456C8D] uppercase tracking-wider">
                            Ações Rápidas
                          </span>
                          </div>
                          {financeQuickActions.map(action => (
                          <Link
                            key={action.title}
                            to={action.url}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EAEAEA] hover:bg-[#456C8D] hover:text-white transition-colors text-sm font-medium mb-1 text-[#131A20]"
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
        <div className="hidden md:flex items-center justify-between bg-white border-b border-[#EAEAEA] px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="hover:bg-[#EAEAEA] rounded-lg h-9 px-3"
          >
            {open ? (
              <>
                <PanelLeftClose className="w-4 h-4 mr-2 text-[#456C8D]" />
                <span className="text-sm text-[#456C8D]">Ocultar Menu</span>
              </>
            ) : (
              <>
                <PanelLeft className="w-4 h-4 mr-2 text-[#456C8D]" />
                <span className="text-sm text-[#456C8D]">Mostrar Menu</span>
              </>
            )}
          </Button>
          <div className="flex-1" />
        </div>



        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="absolute inset-0 bg-[#131A20]/50" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
              <div className="p-4">
                <div className="flex justify-end mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:bg-[#EAEAEA] rounded-lg"
                  >
                    <X className="w-5 h-5 text-[#456C8D]" />
                  </Button>
                </div>

                <div className="mb-6">
                  <AppSwitcher />
                </div>

                <div className="space-y-1">
                  {currentModule === 'taskflow' && taskFlowNav.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive
                            ? 'bg-[#6FA6FF] text-white'
                            : 'hover:bg-[#EAEAEA] text-[#131A20]'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    );
                  })}
                  {currentModule === 'crm' && crmNav.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive
                            ? 'bg-[#6FA6FF] text-white'
                            : 'hover:bg-[#EAEAEA] text-[#131A20]'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    );
                  })}
                  {currentModule === 'finance' && financeNav.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive
                            ? 'bg-[#456C8D] text-white'
                            : 'hover:bg-[#EAEAEA] text-[#131A20]'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-[#EAEAEA]">
                  <UserProfile />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile bottom navigation bar */}
        <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 bg-white rounded-full px-2 py-2 shadow-lg border border-[#EAEAEA]">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[#EAEAEA] hover:bg-[#6FA6FF] hover:text-white transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <AppSwitcher isMobile={true} />
          </div>
        </div>

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
      <div className="min-h-screen flex w-full bg-white overflow-x-hidden">
        <LayoutContent>{children}</LayoutContent>
      </div>
    </SidebarProvider>
  );
}