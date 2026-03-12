import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FolderKanban, ListTodo, LayoutDashboard, Plus, Package, Building2, Menu, BarChart3, TrendingUp, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";

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

const crmNav = [
  {
    title: "Empresas",
    url: createPageUrl("Companies"),
    icon: Building2,
  },
  {
    title: "Prospectção",
    url: createPageUrl("Prospecting"),
    icon: TrendingUp,
  },
  {
    title: "Oportunidades",
    url: createPageUrl("Opportunities"),
    icon: BarChart3,
  },
];

const financeNav = [
  {
    title: "Dashboard",
    url: createPageUrl("FinanceDashboard"),
    icon: BarChart3,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: 'var(--destra-bg)' }}>
      <main className="flex-1 flex flex-col w-full relative">
        <div className="flex-1 overflow-auto">
          {children}
        </div>

        {/* FAB Menu Button - Dark Style */}
        <div className="fixed bottom-6 right-6 z-40">
          {isMenuOpen && (
            <div className="absolute bottom-20 right-0 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-96 max-h-[80vh] overflow-y-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* User Profile Section */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  VG
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">Vitor Gutierrez</p>
                  <p className="text-xs text-slate-400 truncate">comercial@vitorgutierrez@gmail.com</p>
                </div>
              </div>

              {/* TaskFlow Section */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">TaskFlow</p>
                <nav className="space-y-2">
                  {taskFlowNav.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                        {isActive && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* CRM Section */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">CRM</p>
                <nav className="space-y-2">
                  {crmNav.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                        {isActive && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Finance Section */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Financeiro</p>
                <nav className="space-y-2">
                  {financeNav.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                        {isActive && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Logout */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-14 h-14 rounded-full bg-slate-900 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </main>
    </div>
  );
}