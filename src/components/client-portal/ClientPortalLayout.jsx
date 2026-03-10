import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Building2, CheckSquare, Calendar, FolderOpen,
  Star, GitBranch, ListChecks, LogOut, Menu, X, User, ChevronDown, Layers
} from "lucide-react";
import { ClientPortalProvider, useClientPortal } from "./ClientPortalContext";
import ClientPortalGuard from "./ClientPortalGuard";

const navItems = [
  { label: "Dashboard", page: "ClientPortalDashboard", icon: LayoutDashboard },
  { label: "Projeto", page: "ClientPortalProject", icon: Building2 },
  { label: "Entregas", page: "ClientPortalDeliveries", icon: CheckSquare },
  { label: "Onboarding", page: "ClientPortalOnboarding", icon: ListChecks },
  { label: "Calendário", page: "ClientPortalCalendar", icon: Calendar },
  { label: "Arquivos", page: "ClientPortalFiles", icon: FolderOpen },
  { label: "Timeline", page: "ClientPortalTimeline", icon: GitBranch },
  { label: "Avaliação", page: "ClientPortalSatisfaction", icon: Star },
  { label: "Minha Conta", page: "ClientPortalAccount", icon: User },
];

// Public portal pages that don't need sidebar
const AUTH_PAGES = ["clientportallogin", "clientportalfirstaccess", "clientportalforgotpassword"];
const ALL_PORTAL_PAGES = [...navItems.map(n => n.page.toLowerCase()), "clientportalprojectselect", ...AUTH_PAGES];

export default function ClientPortalLayout({ children, currentPageName }) {
  const location = useLocation();
  const currentPage = location.pathname.toLowerCase();

  const isClientPortalPage = ALL_PORTAL_PAGES.some(p => currentPage.includes(p));
  if (!isClientPortalPage) return children;

  const isAuthPage = AUTH_PAGES.some(p => currentPage.includes(p));
  if (isAuthPage) return children; // Auth pages render standalone

  const isProjectSelect = currentPage.includes("clientportalprojectselect");

  return (
    <ClientPortalProvider>
      <ClientPortalGuard>
        <PortalShell isProjectSelect={isProjectSelect}>{children}</PortalShell>
      </ClientPortalGuard>
    </ClientPortalProvider>
  );
}

function PortalShell({ children, isProjectSelect }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, company, selectedProject, projects, setSelectedProject } = useClientPortal();

  if (isProjectSelect) return children;

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[#0D1221] border-r border-white/5 fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight">DESTRA</p>
              <p className="text-[10px] text-slate-500 leading-tight truncate">{company?.name || "Portal do Cliente"}</p>
            </div>
          </div>
        </div>

        {/* Project selector (if multiple) */}
        {projects.length > 1 && selectedProject && (
          <div className="px-3 pt-3">
            <Link to={createPageUrl("ClientPortalProjectSelect")} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all">
              <Layers className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 leading-none mb-0.5">Projeto ativo</p>
                <p className="text-xs font-semibold text-blue-300 truncate">{selectedProject.name}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname.toLowerCase().includes(item.page.toLowerCase());
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          {user && (
            <Link to={createPageUrl("ClientPortalAccount")} className="flex items-center gap-3 mb-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all group">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
                {user.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate group-hover:text-blue-300 transition-colors">{user.full_name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </Link>
          )}
          <button
            onClick={() => base44.auth.logout(createPageUrl("ClientPortalLogin"))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#0D1221] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">{company?.name || "Portal do Cliente"}</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-400 hover:text-white p-1">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-[#0B0F1A] pt-14 px-4 overflow-y-auto">
          <nav className="space-y-1 py-4">
            {navItems.map(item => {
              const isActive = location.pathname.toLowerCase().includes(item.page.toLowerCase());
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/5 pt-3">
            <button
              onClick={() => base44.auth.logout(createPageUrl("ClientPortalLogin"))}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}