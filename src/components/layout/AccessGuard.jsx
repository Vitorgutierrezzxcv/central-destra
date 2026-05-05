import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FullPageLoader } from "@/components/ui/LoadingOverlay";

export default function AccessGuard({ requiredModule, children }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return <FullPageLoader theme="light" />;
  }

  // Se o usuário não tem allowed_modules definido ou é vazio, tem acesso a tudo
  const allowedModules = user?.allowed_modules || [];
  const hasFullAccess = !allowedModules || allowedModules.length === 0;
  const hasAccess = hasFullAccess || allowedModules.includes(requiredModule);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h1>
          <p className="text-slate-600 mb-6">
            Você não tem permissão para acessar esta área. Entre em contato com o administrador.
          </p>
          <Link to={createPageUrl(getDefaultPageForUser(allowedModules))}>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-full">
              Ir para Área Permitida
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

function getDefaultPageForUser(allowedModules) {
  if (!allowedModules || allowedModules.length === 0) return "Dashboard";
  
  const modulePages = {
    taskflow: "Dashboard",
    crm: "Companies",
    finance: "Lancamentos",
    prospecting: "Prospecting",
    pages: "Pages"
  };
  
  // Prioriza prospecção se o usuário tiver acesso
  if (allowedModules.includes('prospecting')) return "Prospecting";
  
  return modulePages[allowedModules[0]] || "Dashboard";
}

export function useUserAccess() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const allowedModules = user?.allowed_modules || [];
  const hasFullAccess = !allowedModules || allowedModules.length === 0;

  const isClientRole = user?.role === "client_user" || user?.role === "client_approver";
  const isInternalRole = !isClientRole;

  const canAccess = (module) => {
    if (module === "client_portal_admin") {
      // Admin e internal_team podem ver o painel de admin
      return !isClientRole || hasFullAccess;
    }
    if (module === "clientportal") {
      // Clientes só acessam o portal do cliente
      return isClientRole || !isClientRole; // todos podem
    }
    // Clientes não acessam módulos internos
    if (isClientRole) return false;
    return hasFullAccess || allowedModules.includes(module);
  };

  const getDefaultPage = () => {
    return getDefaultPageForUser(allowedModules);
  };

  return { user, allowedModules, hasFullAccess, canAccess, getDefaultPage };
}