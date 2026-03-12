import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, FolderKanban, ListTodo, Package, Building2, TrendingUp, BarChart3, LogOut, Menu, Calendar, FileText, Users, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

import UserProfile from "./components/layout/UserProfile";
import AppSwitcher from "./components/layout/AppSwitcher";

const mainNav = [
  {
    title: "Visão Geral",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    category: "TASKFLOW"
  },
  {
    title: "Projetos",
    url: createPageUrl("Projects"),
    icon: FolderKanban,
    category: "TASKFLOW"
  },
  {
    title: "Tarefas",
    url: createPageUrl("Tasks"),
    icon: ListTodo,
    category: "TASKFLOW"
  },
  {
    title: "Backlog",
    url: createPageUrl("Backlog"),
    icon: Package,
    category: "TASKFLOW"
  },
  {
    title: "Calendário",
    url: createPageUrl("CalendarSync"),
    icon: Calendar,
    category: "TASKFLOW"
  },
  {
    title: "Empresas",
    url: createPageUrl("Companies"),
    icon: Building2,
    category: "CRM"
  },
  {
    title: "Prospectção",
    url: createPageUrl("Prospecting"),
    icon: TrendingUp,
    category: "CRM"
  },
  {
    title: "Oportunidades",
    url: createPageUrl("Opportunities"),
    icon: BarChart3,
    category: "CRM"
  },
  {
    title: "Relatórios",
    url: createPageUrl("PerformanceReports"),
    icon: FileText,
    category: "ADMINISTRATIVO"
  },
  {
    title: "Central do Cliente",
    url: createPageUrl("ClientPortalTasks"),
    icon: Users,
    category: "ADMINISTRATIVO"
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const groupedNav = mainNav.reduce((acc, item) => {
    const existing = acc.find(g => g.category === item.category);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ category: item.category, items: [item] });
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: '#F8F9FB' }}>
      {/* Backdrop */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col w-full relative">
        <div className="flex-1 overflow-auto">
          {children}
        </div>

        {/* FAB Menu Button */}
        <div className="fixed bottom-6 right-6 z-40">
          {isMenuOpen && (
            <div className="absolute bottom-20 right-0 bg-white rounded-3xl shadow-2xl border border-slate-100 w-96 max-h-[85vh] overflow-y-auto p-0 animate-in fade-in slide-in-from-bottom-4">
              {/* User Profile Section */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    VG
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-light text-slate-900 text-sm">Vitor Gutierrez</p>
                    <p className="text-xs text-slate-500 truncate">comercial@vitorgutierrez.com</p>
                  </div>
                </div>
              </div>

              {/* Navigation Sections */}
              <div className="divide-y divide-slate-100">
                {groupedNav.map((group) => (
                  <div key={group.category} className="p-6 space-y-3">
                    <p className="text-xs font-light uppercase tracking-wider text-slate-400">{group.category}</p>
                    <nav className="space-y-2">
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                          <Link
                            key={item.title}
                            to={item.url}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-light">{item.title}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 w-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all text-sm font-light"
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
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </main>
    </div>
  );
}