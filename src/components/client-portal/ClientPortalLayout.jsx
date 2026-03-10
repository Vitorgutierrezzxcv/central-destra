import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Building2, CheckSquare, Calendar, FolderOpen,
  Star, GitBranch, ListChecks, LogOut, Menu, X, FolderKanban, User, ChevronRight
} from "lucide-react";
import { useClientPortal } from "./useClientPortal";

const navItems = [
  { label: "Dashboard", page: "ClientPortalDashboard", icon: LayoutDashboard },
  { label: "Projetos", page: "ClientPortalProjects", icon: FolderKanban },
  { label: "Projeto", page: "ClientPortalProject", icon: Building2 },
  { label: "Entregas", page: "ClientPortalDeliveries", icon: CheckSquare },
  { label: "Onboarding", page: "ClientPortalOnboarding", icon: ListChecks },
  { label: "Calendário", page: "ClientPortalCalendar", icon: Calendar },
  { label: "Arquivos", page: "ClientPortalFiles", icon: FolderOpen },
  { label: "Timeline", page: "ClientPortalTimeline", icon: GitBranch },
  { label: "Avaliação", page: "ClientPortalSatisfaction", icon: Star },
];

const CLIENT_PORTAL_SLUGS = navItems.map(n => n.page.toLowerCase()).concat(["clientportallogin", "clientportalaccount", "clientportalactivate"]);

export default function ClientPortalLayout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userLoading, company, projects, isClientRole } = useClientPortal();

  const isClientPortalPage = CLIENT_PORTAL_SLUGS.some(p =>
    location.pathname.toLowerCase().includes(p)
  );
  const isLoginPage = location.pathname.toLowerCase().includes("clientportallogin");
  const isActivatePage = location.pathname.toLowerCase().includes("clientportalactivate");

  // Auth guard
  useEffect(() => {
    if (userLoading) return;

    if (!isClientPortalPage) return; // not our concern

    if (!user && !isLoginPage && !isActivatePage) {
      // Not logged in → go to portal login
      navigate(createPageUrl("ClientPortalLogin"), { replace: true });
      return;
    }

    if (user && isClientRole) {
      const isOnInternalPage = !isClientPortalPage;
      if (isOnInternalPage) {
        navigate(createPageUrl("ClientPortalDashboard"), { replace: true });
      }
    }
  }, [user, userLoading, isClientRole, isClientPortalPage, isLoginPage]);

  if (!isClientPortalPage) return children;

  // Show spinner while checking auth (but not on login page)
  if (userLoading && !isLoginPage) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Login page has its own full-page layout
  if (isLoginPage) return children;

  // Esconde "Projetos" se só tem 1 projeto; esconde nav toda se não é cliente
  const visibleNav = navItems.filter(n => {
    if (n.page === "ClientPortalProjects") return projects.length > 1;
    return true;
  });

  // Não tem usuário autenticado — não renderizar sidebar (login vai cuidar disso)
  const showSidebar = !!user && isClientRole;

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-[#0B0F1A]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[#0D1221] border-r border-white/5 fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-widest leading-tight">DESTRA</p>
              <p className="text-[10px] text-slate-500 tracking-wider leading-tight">PORTAL DO CLIENTE</p>
            </div>
          </div>
          {company && (
            <div className="mt-4 px-3 py-2 bg-white/4 border border-white/8 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Empresa</p>
              <p className="text-xs font-medium text-slate-200 mt-0.5 truncate">{company.name}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(item => {
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
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          <Link
            to={createPageUrl("ClientPortalAccount")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full
              ${location.pathname.toLowerCase().includes("clientportalaccount")
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
          >
            <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.full_name || "Cliente"}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <User className="w-3.5 h-3.5 opacity-50" />
          </Link>
          <button
            onClick={() => base44.auth.logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
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
          <span className="text-sm font-bold text-white">Portal do Cliente</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-400 hover:text-white">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-[#0B0F1A] pt-14 px-4 overflow-y-auto">
          {company && (
            <div className="mx-4 my-4 px-3 py-2 bg-white/5 border border-white/8 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Empresa</p>
              <p className="text-sm font-medium text-white">{company.name}</p>
            </div>
          )}
          <nav className="space-y-1 py-2">
            {visibleNav.map(item => {
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
            <Link
              to={createPageUrl("ClientPortalAccount")}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5"
            >
              <User className="w-4 h-4" />
              Minha Conta
            </Link>
          </nav>
          <button
            onClick={() => base44.auth.logout()}
            className="w-full mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/5"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}