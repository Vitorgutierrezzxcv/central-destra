import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientPortalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Se já está logado, redireciona direto
  useEffect(() => {
    base44.auth.me()
      .then(user => {
        if (user) {
          const isClient = user.role === "client_user" || user.role === "client_approver";
          if (isClient) navigate(createPageUrl("ClientPortalDashboard"));
          else navigate(createPageUrl("Dashboard"));
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true);
    setError("");
    try {
      // Base44 usa o fluxo padrão de autenticação — o login é gerenciado pela plataforma
      // Redirecionar para a página de login nativo da plataforma com next para o portal
      base44.auth.redirectToLogin(createPageUrl("ClientPortalDashboard"));
    } catch {
      setError("E-mail ou senha inválidos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[#0D1221] border-r border-white/5 p-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-800/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-widest">DESTRA</p>
            <p className="text-xs text-slate-500 tracking-wider">PORTAL DO CLIENTE</p>
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Acompanhe seu projeto<br />
            <span className="text-blue-400">em tempo real.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Acesse entregas, aprovações, calendário e muito mais com total transparência.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Entregas", desc: "Revise e aprove" },
              { label: "Progresso", desc: "Acompanhe tudo" },
              { label: "Calendário", desc: "Reuniões e marcos" },
              { label: "Arquivos", desc: "Documentos do projeto" }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-xl p-4">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-widest">DESTRA</p>
              <p className="text-[10px] text-slate-500 tracking-wider">PORTAL DO CLIENTE</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Entrar na sua conta</h1>
            <p className="text-slate-400 text-sm">Acesse o portal exclusivo do seu projeto.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                autoComplete="email"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 h-11 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-300 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-900/30"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-white/3 border border-white/8 rounded-xl">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                O acesso a este portal é controlado pela equipe Destra. Caso ainda não tenha recebido suas credenciais de acesso, entre em contato com o seu gestor de conta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}