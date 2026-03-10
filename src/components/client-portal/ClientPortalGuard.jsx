import React from "react";
import { useClientPortal } from "./ClientPortalContext";
import { createPageUrl } from "@/utils";
import { Link, useLocation } from "react-router-dom";
import { ShieldX, Loader2, LogIn } from "lucide-react";

/**
 * Guards all client portal pages.
 * - Not logged in → redirect to login
 * - Not a client role → access denied
 * - No active project selected → project selector
 * - Access inactive → access denied
 */
export default function ClientPortalGuard({ children }) {
  const { user, isLoading, isClientRole, selectedProject, projects, company, isAccessActive } = useClientPortal();
  const location = useLocation();

  // Allowed pages that bypass the guard (login, first-access, forgot-password)
  const publicPages = ["clientportallogin", "clientportalfirstaccess", "clientportalforgotpassword"];
  const currentPage = location.pathname.toLowerCase();
  const isPublicPage = publicPages.some(p => currentPage.includes(p));

  if (isPublicPage) return children;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4">
        <div className="bg-[#0D1221] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Acesso ao Portal do Cliente</h2>
          <p className="text-slate-400 text-sm mb-6">Faça login para acessar sua área exclusiva.</p>
          <Link
            to={createPageUrl("ClientPortalLogin")}
            className="block w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  if (!isClientRole) {
    return (
      <AccessDenied message="Esta área é exclusiva para clientes da Destra." backTo="Dashboard" backLabel="Ir para painel interno" />
    );
  }

  if (!isAccessActive) {
    return (
      <AccessDenied message="Seu acesso está inativo. Entre em contato com a equipe Destra." />
    );
  }

  // If multiple projects and none selected, show selector
  const isOnSelector = currentPage.includes("clientportalprojectselect");
  if (!selectedProject && projects.length > 1 && !isOnSelector) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4">
        <div className="bg-[#0D1221] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-slate-400 text-sm mb-4">Selecione um projeto para continuar.</p>
          <Link to={createPageUrl("ClientPortalProjectSelect")} className="block w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
            Escolher Projeto
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

function AccessDenied({ message, backTo, backLabel }) {
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4">
      <div className="bg-[#0D1221] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Acesso Negado</h2>
        <p className="text-slate-400 text-sm mb-6">{message || "Você não tem permissão para acessar esta área."}</p>
        {backTo && (
          <Link to={createPageUrl(backTo)} className="block w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/10">
            {backLabel || "Voltar"}
          </Link>
        )}
      </div>
    </div>
  );
}