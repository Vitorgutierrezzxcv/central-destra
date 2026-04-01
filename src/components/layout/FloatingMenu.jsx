import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Grid3x3, X, LayoutDashboard, FolderKanban, ListTodo, Package, Repeat,
  Target, TrendingUp, Building2, FileText, PieChart, Receipt, BarChart2,
  CreditCard, Wallet, Users, DollarSign, Clock, UserCog, ExternalLink,
  LogOut, Plus, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navSections = [
  {
    label: "Task Flow",
    color: "#6FA6FF",
    items: [
      { title: "Visão Geral",   url: createPageUrl("Dashboard"),     icon: LayoutDashboard },
      { title: "Projetos",      url: createPageUrl("Projects"),       icon: FolderKanban },
      { title: "Tarefas",       url: createPageUrl("Tasks"),          icon: ListTodo },
      { title: "Backlog",       url: createPageUrl("Backlog"),        icon: Package },
      { title: "Recorrentes",   url: createPageUrl("RecurringTasks"), icon: Repeat },
    ],
  },
  {
    label: "CRM",
    color: "#34D399",
    items: [
      { title: "Empresas",      url: createPageUrl("Companies"),      icon: Building2 },
      { title: "Oportunidades", url: createPageUrl("Opportunities"),  icon: Target },
      { title: "Prospecção",    url: createPageUrl("Prospecting"),    icon: TrendingUp },
    ],
  },
  {
    label: "Financeiro",
    color: "#FBBF24",
    items: [
      { title: "Dashboard",           url: createPageUrl("FinanceDashboard"),        icon: PieChart },
      { title: "Lançamentos",         url: createPageUrl("FinanceEntries"),           icon: Receipt },
      { title: "Relatórios",          url: createPageUrl("FinanceReports"),           icon: BarChart2 },
      { title: "Fluxo de Caixa",      url: createPageUrl("FinanceCashFlow"),          icon: TrendingUp },
      { title: "Gastos Fixos",        url: createPageUrl("FinanceFixedExpenses"),     icon: CreditCard },
      { title: "Gastos Variáveis",    url: createPageUrl("FinanceVariableExpenses"),  icon: Wallet },
      { title: "Folha de Pagamento",  url: createPageUrl("FinancePayroll"),           icon: Users },
      { title: "Contas",              url: createPageUrl("FinanceAccounts"),          icon: DollarSign },
      { title: "Fechamento Mensal",   url: createPageUrl("FinanceMonthlyClosing"),    icon: Clock },
    ],
  },
  {
    label: "Central do Cliente",
    color: "#A78BFA",
    items: [
      { title: "Gestão de Acessos",       url: createPageUrl("ClientPortalAdmin"), icon: UserCog },
      { title: "Abrir Portal do Cliente", url: createPageUrl("ClientPortalLogin"), icon: ExternalLink },
    ],
  },
  {
    label: "Outros",
    color: "#94A3B8",
    items: [
      { title: "Páginas / Wiki", url: createPageUrl("Pages"), icon: FileText },
    ],
  },
];

function NavSection({ section, location, onClose }) {
  const [open, setOpen] = useState(
    section.items.some(i => location.pathname === i.url)
  );

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: section.color }}
          />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
            {section.label}
          </span>
        </div>
        <ChevronRight
          className="w-3.5 h-3.5 text-white/30 transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div className="ml-2 mb-1 space-y-0.5">
          {section.items.map(item => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-white/12 text-white font-medium"
                    : "text-white/55 hover:text-white hover:bg-white/6"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                {item.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FloatingMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const displayName = user?.display_name || user?.full_name || "Usuário";
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center rounded-full shadow-2xl transition-all"
        style={{
          background: open
            ? "rgba(255,255,255,0.15)"
            : "rgba(19,26,32,0.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
        aria-label="Menu"
      >
        {open
          ? <X className="w-5 h-5 text-white" />
          : <Grid3x3 className="w-5 h-5 text-white" />
        }
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed bottom-24 right-6 z-50 w-72 flex flex-col overflow-hidden rounded-2xl"
            style={{
              maxHeight: "72vh",
              background: "rgba(13,18,33,0.85)",
              backdropFilter: "blur(40px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {/* User header */}
            {user && (
              <div
                className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-white/10">
                  {user.profile_photo_url && <AvatarImage src={user.profile_photo_url} />}
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-white/35 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Nav sections */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {navSections.map(section => (
                <NavSection
                  key={section.label}
                  section={section}
                  location={location}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>

            {/* Footer */}
            <div
              className="px-3 py-3 flex-shrink-0 space-y-1.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex gap-2">
                <Link
                  to={createPageUrl("Projects")}
                  onClick={() => setOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Projeto
                </Link>
                <Link
                  to={createPageUrl("Tasks")}
                  onClick={() => setOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Tarefa
                </Link>
              </div>
              <button
                onClick={() => { base44.auth.logout(); setOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  color: "rgba(252,165,165,0.9)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}