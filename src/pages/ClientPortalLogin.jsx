import React, { useState, useEffect } from "react";
import { Mail, ArrowRight, Loader2, Lock, Eye, EyeOff, Copy, CheckCheck, AlertCircle } from "lucide-react";
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
    if (isLoggedIn()) navigate("/ClientPortalDashboard", { replace: true });
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
      setError(err?.response?.data?.error || err?.message || "Erro ao conectar. Tente novamente.");
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
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left panel — decorative (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-8 xl:p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-white text-sm font-light tracking-widest">D</span>
            </div>
            <span className="text-white/60 text-xs tracking-widest uppercase font-light">Destra</span>
          </div>
          <h2 className="text-4xl font-extralight text-white leading-tight mb-4">
            Portal do<br />Cliente
          </h2>
          <p className="text-slate-400 text-base font-light leading-relaxed">
            Acompanhe seus projetos,<br />
            aprovações e entregas<br />
            em tempo real.
          </p>
        </div>
        <div className="space-y-3">
          {[
            "Visibilidade completa do projeto",
            "Aprovação de entregas",
            "Comunicação direta com a equipe",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <p className="text-slate-400 text-sm font-light">{item}</p>
            </div>
          ))}
          <p className="text-slate-600 text-xs mt-6 font-light tracking-wide">
            © {new Date().getFullYear()} Destra · Acesso seguro
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 md:px-8 py-12 md:py-16 bg-white">
        <div className="w-full max-w-sm md:max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
              <span className="text-white text-sm font-light tracking-widest">D</span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase font-light">Destra · Portal do Cliente</p>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-light text-slate-900 tracking-tight">
              {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-1.5 font-light">
              {mode === "login"
                ? "Acesse seu portal com suas credenciais."
                : "Registre-se para acessar seu portal."}
            </p>
          </div>

          {/* Mode switcher */}
          <div className="flex gap-1 mb-8 border-b border-slate-100">
            {[
              { key: "login", label: "Entrar" },
              { key: "register", label: "Cadastrar" },
            ].map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMode(m.key); setError(""); }}
                className={`pb-3 px-1 text-sm font-medium transition-all border-b-2 mr-5 ${
                  mode === m.key
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-2 tracking-wide">Nome completo</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-500 font-medium block mb-2 tracking-wide">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 font-medium block mb-2 tracking-wide">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
                  required
                  minLength={6}
                  className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-slate-900 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-slate-800 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span className="font-light">Aguarde...</span></>
              ) : (
                <><span>{mode === "register" ? "Criar conta" : "Entrar"}</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Link copiável (admin hint) */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-[10px] text-slate-300 uppercase tracking-widest mb-3 font-medium">Link de acesso</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 overflow-hidden">
                <p className="text-[10px] text-slate-400 truncate font-mono">{PORTAL_URL}</p>
              </div>
              <button
                onClick={copyLink}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-medium transition-all border
                  ${copied
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
              >
                {copied ? <><CheckCheck className="w-3 h-3" />Copiado</> : <><Copy className="w-3 h-3" />Copiar</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}