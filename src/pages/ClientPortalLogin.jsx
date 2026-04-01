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
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(40px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <div className="text-center mb-7">
            <h2 className="text-xl font-semibold text-white mb-2">Bem-vindo</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Crie sua conta gratuitamente ou entre para acompanhar seu projeto em tempo real.
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={redirecting}
            className="w-full h-13 text-base font-semibold gap-3 rounded-2xl mb-3 transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #4F8EF7 0%, #6B6FFF 100%)",
              boxShadow: "0 4px 24px rgba(79,142,247,0.4)",
              border: "none",
              height: "52px",
            }}
          >
            {redirecting ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Redirecionando...</>
            ) : (
              <><Mail className="w-5 h-5" />Entrar / Criar Conta<ArrowRight className="w-4 h-4 ml-auto" /></>
            )}
          </Button>

          <div className="mt-6 p-4 rounded-2xl" style={{ background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.15)" }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-1">Sem aprovação prévia</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cadastre-se com seu e-mail e acesse imediatamente. Após o login, a equipe Destra vinculará você ao seu projeto.
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