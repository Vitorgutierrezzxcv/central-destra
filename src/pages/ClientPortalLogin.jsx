import React, { useState, useEffect } from "react";
import { Building2, Mail, ArrowRight, Loader2, Lock, Eye, EyeOff, Copy, CheckCheck, AlertCircle, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { saveSession, isLoggedIn } from "@/lib/clientPortalSession";

const PORTAL_URL = window.location.origin + "/ClientPortalLogin";

export default function ClientPortalLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/ClientPortalDashboard", { replace: true });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("clientPortalAuth", { action: mode, email, password, name });
      if (res.data?.success) {
        saveSession(res.data.token, res.data.profile, res.data.expiresAt);
        navigate("/ClientPortalDashboard", { replace: true });
      } else {
        setError(res.data?.error || "Erro desconhecido.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(PORTAL_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col items-center justify-center px-5 py-10">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/40">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Portal do Cliente</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Acompanhe seu projeto com a Destra</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-7 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(40px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          {/* Mode toggle */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all
                ${mode === "login" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all
                ${mode === "register" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <Label className="text-slate-300 text-xs mb-1.5 block">Seu nome</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome completo"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-11"
                  required
                />
              </div>
            )}

            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-11 pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Crie uma senha (mín. 6 caracteres)" : "Sua senha"}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-11 pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold gap-2 rounded-2xl transition-all active:scale-95 mt-1"
              style={{
                background: mode === "register"
                  ? "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)"
                  : "linear-gradient(135deg, #4F8EF7 0%, #6B6FFF 100%)",
                boxShadow: mode === "register"
                  ? "0 4px 20px rgba(147,51,234,0.35)"
                  : "0 4px 20px rgba(79,142,247,0.35)",
                border: "none",
              }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />{mode === "register" ? "Criando conta..." : "Entrando..."}</>
                : mode === "register"
                  ? <><UserPlus className="w-4 h-4" />Criar Conta<ArrowRight className="w-4 h-4 ml-auto" /></>
                  : <><LogIn className="w-4 h-4" />Entrar<ArrowRight className="w-4 h-4 ml-auto" /></>
              }
            </Button>
          </form>
        </div>

        {/* Link copiável */}
        <div className="mt-5 rounded-2xl p-4" style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)"
        }}>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-medium">Link de acesso para clientes</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 rounded-xl px-3 py-2 overflow-hidden">
              <p className="text-xs text-slate-300 truncate font-mono">{PORTAL_URL}</p>
            </div>
            <button
              onClick={copyLink}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all
                ${copied
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                }`}
            >
              {copied ? <><CheckCheck className="w-3.5 h-3.5" />Copiado!</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2">Envie este link para o cliente acessar o portal.</p>
        </div>

        <p className="text-center text-[11px] text-slate-700 mt-5">
          © {new Date().getFullYear()} Destra · Acesso seguro
        </p>
      </div>
    </div>
  );
}