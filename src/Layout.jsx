import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FolderKanban, ListTodo, LayoutDashboard, Package,
  Building2, X, Menu, LogOut, User, ChevronRight,
  DollarSign, Target, Layers
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const modules = [
  {
    id: "taskflow",
    label: "TaskFlow",
    icon: FolderKanban,
    color: "#6FA6FF",
    pages: [
      { title: "Visão Geral", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
      { title: "Projetos", url: createPageUrl("Projects"), icon: FolderKanban },
      { title: "Tarefas", url: createPageUrl("Tasks"), icon: ListTodo },
      { title: "Backlog", url: createPageUrl("Backlog"), icon: Package },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: Building2,
    color: "#456C8D",
    pages: [
      { title: "Empresas", url: createPageUrl("Companies"), icon: Building2 },
      { title: "Prospecção", url: createPageUrl("Prospecting"), icon: Target },
      { title: "Oportunidades", url: createPageUrl("Opportunities"), icon: Layers },
    ],
  },
  {
    id: "finance",
    label: "Financeiro",
    icon: DollarSign,
    color: "#131A20",
    pages: [
      { title: "Dashboard", url: createPageUrl("FinanceDashboard"), icon: LayoutDashboard },
      { title: "Lançamentos", url: createPageUrl("FinanceEntries"), icon: DollarSign },
      { title: "Contas", url: createPageUrl("FinanceAccounts"), icon: Layers },
    ],
  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const displayName = user?.display_name || user?.full_name || user?.email || "";
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Find active module based on current path
  const activeModule = modules.find(m =>
    m.pages.some(p => location.pathname === p.url || location.pathname.startsWith(p.url + "?"))
  );

  return (
    <div className="min-h-screen w-full bg-[#F7F7F7]">
      {/* Page content */}
      <div className="w-full">
        {children}
      </div>

      {/* Backdrop blur overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 backdrop-blur-sm bg-[#131A20]/30"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Menu Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-24 right-4 md:right-6 z-50 w-72 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 8px 40px rgba(19,26,32,0.18), 0 0 0 1px rgba(19,26,32,0.06)",
            }}
          >
            {/* User header */}
            <div className="px-4 py-4 border-b border-[#EAEAEA] flex items-center gap-3">
              <Avatar className="w-9 h-9 flex-shrink-0">
                {user?.profile_photo_url && <AvatarImage src={user.profile_photo_url} />}
                <AvatarFallback className="bg-[#131A20] text-white text-xs font-normal">
                  {initials || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-normal text-[#131A20] truncate">{displayName}</p>
                <p className="text-[11px] font-light text-[#456C8D] truncate">{user?.email}</p>
              </div>
            </div>

            {/* Navigation modules */}
            <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
              {modules.map((mod) => (
                <div key={mod.id}>
                  <div className="flex items-center gap-2 px-2 mb-1.5">
                    <mod.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: mod.color }} />
                    <span className="text-[10px] font-normal uppercase tracking-wider text-[#456C8D]">{mod.label}</span>
                  </div>
                  <div className="space-y-0.5">
                    {mod.pages.map((page) => {
                      const isActive = location.pathname === page.url;
                      return (
                        <Link
                          key={page.url}
                          to={page.url}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                            isActive
                              ? "bg-[#131A20] text-white"
                              : "text-[#131A20] hover:bg-[#F7F7F7]"
                          }`}
                        >
                          <page.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-[#456C8D]"}`} />
                          <span className="text-sm font-light">{page.title}</span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-3 pb-3 pt-1 border-t border-[#EAEAEA] mt-1">
              <button
                onClick={() => base44.auth.logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#456C8D] hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-light">Sair</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors"
        style={{
          background: open ? "#131A20" : "#131A20",
          boxShadow: "0 4px 24px rgba(19,26,32,0.28)",
        }}
        aria-label="Menu de navegação"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-5 h-5 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}