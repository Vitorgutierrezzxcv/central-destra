import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FolderKanban, ListTodo, LayoutDashboard, Plus, Package, Building2, ChevronDown, ChevronRight } from "lucide-react";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <main className="flex-1 flex flex-col w-full">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 md:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors" />
              <AppSwitcher isMobile={true} />
              <div className="w-10" />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>

          {/* FAB Navigation Button */}
          <div className="fixed bottom-6 right-6 z-40">
            {isNavOpen && (
              <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-slate-200 w-72 max-h-96 overflow-y-auto p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Navegação</h3>
                  <button 
                    onClick={() => setIsNavOpen(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <FolderKanban className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">TaskFlow</p>
                      <p className="text-xs text-slate-600">Projetos e Tarefas</p>
                    </div>
                  </div>

                  <nav className="space-y-2 pl-2">
                    {taskFlowNav.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <Link
                          key={item.title}
                          to={item.url}
                          onClick={() => setIsNavOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.title}</span>
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">Ações Rápidas</p>
                    <div className="space-y-2">
                      {taskFlowQuickActions.map(action => (
                        <Link 
                          key={action.title}
                          to={action.url}
                          onClick={() => setIsNavOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${action.color} transition-colors text-sm font-medium`}
                        >
                          <action.icon className="w-4 h-4" />
                          {action.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="px-3">
                    <AppSwitcher />
                  </div>
                  <UserProfile />
                </div>
              </div>
            )}

            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
            >
              <FolderKanban className="w-6 h-6" />
            </button>
          </div>
        </main>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 md:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors" />
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