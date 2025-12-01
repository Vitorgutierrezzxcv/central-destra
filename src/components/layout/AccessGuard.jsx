import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AccessGuard({ requiredModule, children }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
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
    prospecting: "Prospecting"
  };
  
  return modulePages[allowedModules[0]] || "Dashboard";
}

export function useUserAccess() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const allowedModules = user?.allowed_modules || [];
  const hasFullAccess = !allowedModules || allowedModules.length === 0;

  const canAccess = (module) => {
    return hasFullAccess || allowedModules.includes(module);
  };

  const getDefaultPage = () => {
    return getDefaultPageForUser(allowedModules);
  };

  return { user, allowedModules, hasFullAccess, canAccess, getDefaultPage };
}