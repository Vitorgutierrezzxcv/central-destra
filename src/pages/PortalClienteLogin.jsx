import React, { useState, useEffect } from "react";
import { Mail, ArrowRight, Loader2, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { saveSession, isLoggedIn } from "@/lib/clientPortalSession";

async function callAuth(payload) {
  const res = await base44.functions.invoke("clientPortalAuth", payload);
  return res?.data ?? res;
}

export default function PortalClienteLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const data = await callAuth({
        action: mode,
        email: email.trim().toLowerCase(),
        password,
        name,
      });

      if (data?.success) {
        saveSession(data.token, data.profile, data.expiresAt);
        navigate("/ClientPortalDashboard", { replace: true });
      } else {
        setError(data?.error || "Erro desconhecido. Tente novamente.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col lg:flex-row">
      {/* Left panel — desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-900/40 border-r border-white/5 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-white text-sm font-light tracking-widest">D</span>
            </div>
            <span className="text-white/50 text-xs tracking-widest uppercase font-light">Destra</span>
          </div>
          <h2 className="text-4xl font-extralight text-white leading-tight mb-4">
            Portal do<br />Cliente
          </h2>
          <p className="text-slate-500 text-base font-light leading-relaxed">
            Acompanhe seus projetos,<br />
            aprovações e entregas<br />
            em tempo real.
          </p>
        </div>
        <div className="space-y-2">
          {["Visibilidade completa do projeto", "Aprovação de entregas", "Comunicação direta com a equipe"].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <p className="text-slate-600 text-sm font-light">{item}</p>
            </div>
          ))}
          <p className="text-slate-700 text-xs mt-6 font-light">© {new Date().getFullYear()} Destra · Acesso seguro</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-white text-sm font-light tracking-widest">D</span>
            </div>
            <span className="text-white/50 text-xs tracking-widest uppercase font-light">Portal do Cliente</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-light text-white mb-2">
              {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </h1>
            <p className="text-slate-500 text-sm font-light">
              {mode === "login"
                ? "Primeiro acesso? Use seu e-mail e defina uma senha."
                : "Registre-se para acessar o portal."}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 mb-7 bg-white/5 rounded-xl p-1">
            {[{ key: "login", label: "Entrar" }, { key: "register", label: "Cadastrar" }].map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMode(m.key); setError(""); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  mode === m.key
                    ? "bg-white text-slate-900"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-2 tracking-wide uppercase">Nome completo</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo" required
                  className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/25 focus:bg-white/8 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-500 font-medium block mb-2 tracking-wide uppercase">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" required
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/25 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium block mb-2 tracking-wide uppercase">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"} required minLength={6}
                  className="w-full h-12 pl-11 pr-12 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/25 focus:bg-white/8 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300 leading-relaxed">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-white text-slate-900 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50 mt-1">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Aguarde...</span></>
                : <><span>{mode === "register" ? "Criar conta" : "Entrar"}</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}