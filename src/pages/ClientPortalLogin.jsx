import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Mail, ArrowRight, Loader2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ClientPortalLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    base44.auth.isAuthenticated()
      .then(authenticated => {
        if (authenticated) {
          navigate(createPageUrl("ClientPortalDashboard"), { replace: true });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogin = () => {
    setRedirecting(true);
    base44.auth.redirectToLogin(createPageUrl("ClientPortalDashboard"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col items-center justify-center px-6 py-12">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-900/40">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Portal do Cliente</h1>
          <p className="text-slate-400 mt-2 text-sm">Acompanhe seu projeto com a Destra</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0D1221] border border-white/8 rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Acesse sua conta</h2>
            <p className="text-slate-400 text-sm">
              Use o e-mail e senha fornecidos pela equipe Destra para acessar o portal.
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={redirecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium gap-3 rounded-xl"
          >
            {redirecting ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Redirecionando...</>
            ) : (
              <><Mail className="w-5 h-5" />Entrar com E-mail<ArrowRight className="w-4 h-4 ml-auto" /></>
            )}
          </Button>

          <div className="mt-6 p-4 bg-white/3 border border-white/8 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-300 mb-1">Primeiro acesso?</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Você receberá um convite por e-mail da equipe Destra com as instruções de acesso. 
                  Verifique sua caixa de entrada e spam.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <p className="text-xs text-slate-600">Acesso seguro e criptografado</p>
          </div>
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()} Destra. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}