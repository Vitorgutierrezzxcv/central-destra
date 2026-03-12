import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Package,
  Building2,
  TrendingUp,
  DollarSign,
  LogOut,
  X,
  Zap,
  BarChart3,
  ShoppingCart
} from "lucide-react";
import { Link } from "react-router-dom";

export default function UserMenu({ isOpen, onClose }) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  if (!user) return null;

  const displayName = user.display_name || user.full_name || "Usuário";
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const menuSections = [
    {
      title: "TASK FLOW",
      items: [
        { label: "Visão Geral", icon: LayoutDashboard, path: "/Dashboard" },
        { label: "Projetos", icon: FolderKanban, path: "/Projects" },
        { label: "Tarefas", icon: ListTodo, path: "/Tasks" },
        { label: "Backlog", icon: Package, path: "/Backlog" },
      ]
    },
    {
      title: "CRM",
      items: [
        { label: "Empresas", icon: Building2, path: "/Companies" },
        { label: "Oportunidades", icon: TrendingUp, path: "/Opportunities" },
        { label: "Prospecção", icon: Zap, path: "/Prospecting" },
      ]
    },
    {
      title: "FINANCEIRO",
      items: [
        { label: "Dashboard", icon: BarChart3, path: "/FinanceDashboard" },
        { label: "Lançamentos", icon: DollarSign, path: "/FinanceEntries" },
        { label: "Relatórios", icon: BarChart3, path: "/FinanceReports" },
      ]
    }
  ];

  return (
    <>
      {/* Backdrop com blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header com fechar */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 border-2 border-slate-200">
              {user.profile_photo_url ? (
                <AvatarImage src={user.profile_photo_url} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-6 mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </p>
              </div>
              <nav className="space-y-1 mb-6 px-3">
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium group"
                  >
                    <item.icon className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer com Sair */}
        <div className="p-6 border-t border-slate-200">
          <Button
            onClick={() => {
              onClose();
              base44.auth.logout();
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>
    </>
  );
}