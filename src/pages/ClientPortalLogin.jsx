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
  const [mode, setMode] = useState("login");
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
      const res = await base44.functions.invoke("clientPortalAuth", {
        action: mode,
        email: email.trim().toLowerCase(),
        password,
        name
      });
      const data = res?.data ?? res;
      if (data?.success) {
        saveSession(data.token, data.profile, data.expiresAt);
        navigate("/ClientPortalDashboard", { replace: true });
      } else {
        setError(data?.error || "Erro desconhecido. Tente novamente.");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Erro ao conectar. Tente novamente.";
      setError(msg);
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Portal do Cliente</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Acompanhe seu projeto com a Destra</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">
          {/* Mode toggle */}
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all
                ${mode === "login" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all
                ${mode === "register" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <Label className="text-slate-600 text-xs mb-1.5 block">Seu nome</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome completo"
                  className="h-11 rounded-xl border-slate-200"
                  required
                />
              </div>
            )}

            <div>
              <Label className="text-slate-600 text-xs mb-1.5 block">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-11 rounded-xl border-slate-200 pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-600 text-xs mb-1.5 block">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Crie uma senha (mín. 6 caracteres)" : "Sua senha"}
                  className="h-11 rounded-xl border-slate-200 pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-11 text-sm font-semibold gap-2 rounded-xl transition-all mt-1 ${
                mode === "register"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />{mode === "register" ? "Criando conta..." : "Entrando..."}</>
                : mode === "register"
                  ? <><UserPlus className="w-4 h-4" />Criar Conta</>
                  : <><LogIn className="w-4 h-4" />Entrar</>
              }
            </Button>
          </form>
        </div>

        {/* Link copiável */}
        <div className="mt-5 bg-white rounded-2xl p-4 border border-slate-200">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 font-medium">Link de acesso para clientes</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 overflow-hidden">
              <p className="text-xs text-slate-600 truncate font-mono">{PORTAL_URL}</p>
            </div>
            <button
              onClick={copyLink}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border
                ${copied
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                }`}
            >
              {copied ? <><CheckCheck className="w-3.5 h-3.5" />Copiado!</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Envie este link para o cliente acessar o portal.</p>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          © {new Date().getFullYear()} Destra · Acesso seguro
        </p>
      </div>
    </div>
  );
}