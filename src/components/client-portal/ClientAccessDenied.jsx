import React from "react";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function ClientAccessDenied({ message }) {
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-rose-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Acesso Restrito</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          {message || "Você não tem permissão para acessar este conteúdo. Entre em contato com a equipe Destra se acreditar que isso é um erro."}
        </p>
        <Link to={createPageUrl("ClientPortalDashboard")}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}