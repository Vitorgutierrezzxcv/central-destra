import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Building2, CheckSquare, Calendar, FolderOpen,
  GitBranch, ListChecks, LogOut, X, FolderKanban, User, MessageSquare,
  Star, Grid3X3, ChevronRight, Loader2, Receipt, GraduationCap
} from "lucide-react";
import { useClientPortal } from "./useClientPortal";
import { clearSession, isLoggedIn } from "@/lib/clientPortalSession";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Início",      page: "ClientPortalDashboard",  icon: LayoutDashboard, desc: "Visão geral do projeto" },
  { label: "Projetos",    page: "ClientPortalProjects",   icon: FolderKanban,    desc: "Seus projetos" },
  { label: "Projeto",     page: "ClientPortalProject",    icon: Building2,       desc: "Detalhes do projeto" },
  { label: "Tarefas",     page: "ClientPortalTasks",      icon: CheckSquare,     desc: "Acompanhamento de tarefas" },
  { label: "Entregas",    page: "ClientPortalDeliveries", icon: Grid3X3,         desc: "Aprovar entregas" },
  { label: "Onboarding",  page: "ClientPortalOnboarding", icon: ListChecks,      desc: "Checklist de onboarding" },
  { label: "Calendário",  page: "ClientPortalCalendar",   icon: Calendar,        desc: "Reuniões e datas" },
  { label: "Arquivos",    page: "ClientPortalFiles",      icon: FolderOpen,      desc: "Documentos compartilhados" },
  { label: "Timeline",    page: "ClientPortalTimeline",   icon: GitBranch,       desc: "Linha do tempo" },
  { label: "Avaliação",   page: "ClientPortalSatisfaction", icon: Star,          desc: "Avaliar o projeto" },
  { label: "Financeiro",  page: "ClientPortalFinancial",  icon: Receipt,         desc: "Faturas e contratos" },
  { label: "Chamados",    page: "ClientPortalTickets",    icon: MessageSquare,   desc: "Suporte e dúvidas" },
  { label: "Aprenda",     page: "ClientPortalCourses",   icon: GraduationCap,   desc: "Cursos e mentorias" },
  { label: "Minha Conta", page: "ClientPortalAccount",   icon: User,            desc: "Configurações da conta" },
];

export default function ClientPortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);
  const { user, userLoading, company, projects } = useClientPortal();

  const isLoginPage = location.pathname.toLowerCase().includes("clientportallogin") || location.pathname.toLowerCase().includes("autenticar");
  const isActivatePage = location.pathname.toLowerCase().includes("clientportalactivate");

  useEffect(() => {
    if (!userLoading && !isLoggedIn() && !isLoginPage && !isActivatePage) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/Autenticar?next=${next}`, { replace: true });
    }
  }, [userLoading, isLoginPage, isActivatePage]);

  // Fecha menu ao mudar de página
  useEffect(() => {
    setFabOpen(false);
  }, [location.pathname]);

  if (isLoginPage || isActivatePage) {
    return (
      <div className="min-h-screen bg-white">
        <Outlet />
      </div>
    );
  }

  if (userLoading || !isLoggedIn()) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
            <span className="text-white text-lg font-light tracking-widest">D</span>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            <p className="text-sm text-slate-400 font-light tracking-wide">Carregando</p>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearSession();
    navigate("/Autenticar?next=%2FClientPortalDashboard", { replace: true });
  };

  const visibleNav = navItems.filter(n => {
    if (n.page === "ClientPortalProjects") return projects.length > 1;
    return true;
  });

  const currentPage = visibleNav.find(n =>
    location.pathname.toLowerCase().includes(n.page.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* ── Main Content ── */}
      <main className="min-h-screen pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* ── FAB Menu (mobile, and "More" on desktop) ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {fabOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
                onClick={() => setFabOpen(false)}
              />

              {/* Menu Panel */}
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-100 overflow-hidden z-50"
              >
                {/* Header do menu */}
                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {user?.full_name || user?.name || "Cliente"}
                      </p>
                      {company && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{company.name}</p>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
                      {(user?.full_name || user?.name || "C").charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="py-2 max-h-[60vh] overflow-y-auto">
                  {visibleNav.map(item => {
                    const isActive = location.pathname.toLowerCase().includes(item.page.toLowerCase());
                    return (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        onClick={() => setFabOpen(false)}
                        className={`flex items-center gap-3 px-5 py-3 transition-all duration-150 group
                          ${isActive
                            ? "bg-slate-50"
                            : "hover:bg-slate-50/70"
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                          ${isActive ? "bg-slate-900" : "bg-slate-100 group-hover:bg-slate-200"}`}>
                          <item.icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isActive ? "text-slate-900" : "text-slate-700"}`}>
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-400">{item.desc}</p>
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-900 flex-shrink-0" />}
                      </Link>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-50 px-5 py-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 py-2 text-slate-400 hover:text-rose-500 transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-light">Sair da conta</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* FAB Button */}
        <motion.button
          onClick={() => setFabOpen(v => !v)}
          whileTap={{ scale: 0.94 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 z-50 relative
            ${fabOpen
              ? "bg-slate-900 shadow-slate-900/30"
              : "bg-slate-900 shadow-slate-900/25 hover:shadow-slate-900/40"
            }`}
          aria-label="Menu de navegação"
        >
          <AnimatePresence mode="wait">
            {fabOpen ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Grid3X3 className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}