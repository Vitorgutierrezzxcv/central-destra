import React, { useState } from "react";
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

  // Login e Activate têm layout próprio
  if (isLoginPage || isActivatePage) {
    return (
      <div className="min-h-screen bg-[#0B0F1A]">
        <Outlet />
      </div>
    );
  }

  // Se não está logado no portal próprio, redireciona para o login do portal
  if (!userLoading && !isLoggedIn()) {
    navigate("/ClientPortalLogin", { replace: true });
    return null;
  }

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
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
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
            : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        <span>{item.label}</span>
        {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col bg-[#0D1221] border-r border-white/5 fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
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
          {visibleNav.map(item => (
            <NavLink key={item.page} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          <Link
            to={createPageUrl("ClientPortalAccount")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full
              ${location.pathname.toLowerCase().includes("clientportalaccount")
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
          >
            <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
              {(user?.full_name || user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.full_name || user?.name || "Cliente"}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <User className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Mobile: Bottom Tab Bar ───────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0D1221] border-t border-white/5 flex items-center justify-around px-2 py-2 safe-area-bottom">
        {visibleNav.slice(0, 5).map(item => {
          const isActive = location.pathname.toLowerCase().includes(item.page.toLowerCase());
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-0
                ${isActive ? "text-blue-400" : "text-slate-600 hover:text-slate-400"}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate max-w-[52px] text-center leading-tight">{item.label}</span>
            </Link>
          );
        })}
        {/* Botão "Mais" para itens adicionais */}
        <button
          onClick={() => setMobileOpen(true)}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all
            ${mobileOpen ? "text-blue-400" : "text-slate-600 hover:text-slate-400"}`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </div>

      {/* Mobile: Drawer "Mais" */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col">
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="bg-[#0D1221] border-t border-white/5 px-4 pb-safe pt-4 max-h-[70vh] overflow-y-auto rounded-t-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">Navegação</span>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {company && (
              <div className="mb-4 px-3 py-2 bg-white/5 border border-white/8 rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Empresa</p>
                <p className="text-sm font-medium text-white">{company.name}</p>
              </div>
            )}
            <nav className="space-y-1">
              {visibleNav.map(item => (
                <NavLink key={item.page} item={item} onClick={() => setMobileOpen(false)} />
              ))}
              <Link
                to={createPageUrl("ClientPortalAccount")}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5"
              >
                <User className="w-4 h-4" />
                Minha Conta
              </Link>
            </nav>
            <button
              onClick={handleLogout}
              className="w-full mt-3 mb-2 flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/5"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 md:pl-60 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}