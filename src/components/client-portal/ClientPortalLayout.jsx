import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Building2, CheckSquare, Calendar, FolderOpen,
  Star, GitBranch, ListChecks, LogOut, Menu, X, FolderKanban, User, ChevronRight, Loader2
} from "lucide-react";
import { useClientPortal } from "./useClientPortal";
import { clearSession, isLoggedIn } from "@/lib/clientPortalSession";

const navItems = [
  { label: "Início",      page: "ClientPortalDashboard",  icon: LayoutDashboard },
  { label: "Projetos",    page: "ClientPortalProjects",   icon: FolderKanban },
  { label: "Projeto",     page: "ClientPortalProject",    icon: Building2 },
  { label: "Entregas",    page: "ClientPortalDeliveries", icon: CheckSquare },
  { label: "Onboarding",  page: "ClientPortalOnboarding", icon: ListChecks },
  { label: "Calendário",  page: "ClientPortalCalendar",   icon: Calendar },
  { label: "Arquivos",    page: "ClientPortalFiles",      icon: FolderOpen },
  { label: "Timeline",    page: "ClientPortalTimeline",   icon: GitBranch },
  { label: "Avaliação",   page: "ClientPortalSatisfaction", icon: Star },
];

export default function ClientPortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userLoading, company, projects } = useClientPortal();

  const isLoginPage = location.pathname.toLowerCase().includes("clientportallogin");
  const isActivatePage = location.pathname.toLowerCase().includes("clientportalactivate");

  // Redireciona para login se não autenticado (dentro de useEffect para não violar regras de hooks)
  useEffect(() => {
    if (!userLoading && !isLoggedIn() && !isLoginPage && !isActivatePage) {
      navigate("/ClientPortalLogin", { replace: true });
    }
  }, [userLoading, isLoginPage, isActivatePage]);

  // Login e Activate têm layout próprio (light)
  if (isLoginPage || isActivatePage) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Outlet />
      </div>
    );
  }

  // Loading state
  if (userLoading || !isLoggedIn()) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Carregando portal...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearSession();
    navigate("/ClientPortalLogin", { replace: true });
  };

  // Filtra itens de navegação
  const visibleNav = navItems.filter(n => {
    if (n.page === "ClientPortalProjects") return projects.length > 1;
    return true;
  });

  const NavLink = ({ item, onClick }) => {
    const isActive = location.pathname.toLowerCase().includes(item.page.toLowerCase());
    return (
      <Link
        to={createPageUrl(item.page)}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
          ${isActive
            ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        <span>{item.label}</span>
        {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 tracking-widest leading-tight">DESTRA</p>
              <p className="text-[10px] text-slate-400 tracking-wider leading-tight">PORTAL DO CLIENTE</p>
            </div>
          </div>
          {company && (
            <div className="mt-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Empresa</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5 truncate">{company.name}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(item => (
            <NavLink key={item.page} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <Link
            to={createPageUrl("ClientPortalAccount")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full
              ${location.pathname.toLowerCase().includes("clientportalaccount")
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
              {(user?.full_name || user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{user?.full_name || user?.name || "Cliente"}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <User className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* ── Mobile: Top Bar ───────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">Portal Destra</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Mobile: Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="w-72 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-900">Portal Destra</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            {company && (
              <div className="mx-4 mt-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Empresa</p>
                <p className="text-sm font-medium text-slate-700">{company.name}</p>
              </div>
            )}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {visibleNav.map(item => (
                <NavLink key={item.page} item={item} onClick={() => setMobileOpen(false)} />
              ))}
              <Link
                to={createPageUrl("ClientPortalAccount")}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <User className="w-4 h-4" />
                Minha Conta
              </Link>
            </nav>
            <div className="px-3 py-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-rose-600 hover:bg-rose-50 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 md:pl-60 pt-14 md:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}