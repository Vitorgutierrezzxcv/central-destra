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
    // Redireciona para o login dedicado do portal do cliente
    navigate("/PortalClienteLogin", { replace: true });
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
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-6 xl:p-8">
        <div>
          <div className="flex items-center gap-2.5 mb-10">
            <img src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg" alt="Destra" className="w-8 h-8 brightness-0 invert opacity-80" />
            <span className="text-white/60 text-xs tracking-widest uppercase font-light">Destra</span>
          </div>
          <h2 className="text-4xl font-extralight text-white leading-tight mb-2">
            Portal do<br />Cliente
          </h2>
          <p className="text-slate-400 text-base font-light leading-relaxed">
            Acompanhe seus projetos,<br />
            aprovações e entregas<br />
            em tempo real.
          </p>
        </div>
        <div className="space-y-1.5">
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
      <div className="flex-1 flex flex-col items-center justify-center px-5 md:px-4 py-8 md:py-10 bg-white lg:bg-white lg:py-10 lg:px-4">
        {/* Mobile container com fundo azul escuro */}
        <div className="w-full max-w-sm md:max-w-lg lg:bg-white lg:rounded-none">
          <div className="lg:hidden bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl p-8 -mx-5 min-h-screen flex flex-col justify-between">
            <div>
              {/* Mobile logo */}
              <div className="flex items-center gap-3 mb-12">
                <img src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg" alt="Destra" className="w-10 h-10 brightness-0 invert opacity-80" />
                <div>
                  <p className="text-white/70 text-xs tracking-widest uppercase font-light">Destra</p>
                </div>
              </div>

              {/* Title - Bigger and bolder on mobile */}
              <div className="mb-10">
                <h1 className="text-5xl lg:text-2xl font-extralight text-white tracking-tight leading-tight mb-4">
                  {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
                </h1>
                <p className="text-white/60 text-lg lg:text-sm font-light leading-relaxed">
                  {mode === "login"
                    ? "Acesse seu portal com suas credenciais."
                    : "Registre-se para acessar seu portal."}
                </p>
              </div>

              {/* Mode switcher */}
              <div className="flex gap-2 mb-8 border-b border-white/10">
                {[
                  { key: "login", label: "Entrar" },
                  { key: "register", label: "Cadastrar" },
                ].map(m => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => { setMode(m.key); setError(""); }}
                    className={`pb-4 px-2 text-base lg:text-sm font-medium transition-all border-b-2 ${
                      mode === m.key
                        ? "border-white text-white"
                        : "border-transparent text-white/40 hover:text-white/60"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="text-sm text-white/70 font-medium block mb-2 tracking-wide">Nome completo</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Seu nome"
                      required
                      className="w-full h-14 px-5 rounded-2xl border border-white/20 bg-white/5 text-white text-base placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm text-white/70 font-medium block mb-2 tracking-wide">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full h-14 pl-14 pr-5 rounded-2xl border border-white/20 bg-white/5 text-white text-base placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/70 font-medium block mb-2 tracking-wide">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
                      required
                      minLength={6}
                      className="w-full h-14 pl-14 pr-14 rounded-2xl border border-white/20 bg-white/5 text-white text-base placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/15 border border-red-500/30">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300 leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-white text-slate-950 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3 hover:bg-white/90 transition-colors disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Aguarde...</span></>
                  ) : (
                    <><span>{mode === "register" ? "Criar conta" : "Entrar"}</span><ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </form>

              {/* Link copiável (admin hint) */}
              <div className="mt-10 pt-8 border-t border-white/10">
                <p className="text-xs text-white/50 uppercase tracking-widest mb-3 font-medium">Link de acesso</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 overflow-hidden">
                    <p className="text-xs text-white/50 truncate font-mono">{PORTAL_URL}</p>
                  </div>
                  <button
                    onClick={copyLink}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium transition-all border
                      ${copied
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-white/10 text-white/70 border-white/10 hover:bg-white/15"
                      }`}
                  >
                    {copied ? <><CheckCheck className="w-4 h-4" />Copiado</> : <><Copy className="w-4 h-4" />Copiar</>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop form container */}
          <div className="hidden lg:block">
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1.5 tracking-wide">Nome completo</label>
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
                <label className="text-xs text-slate-500 font-medium block mb-1.5 tracking-wide">E-mail</label>
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
                <label className="text-xs text-slate-500 font-medium block mb-1.5 tracking-wide">Senha</label>
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
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-slate-900 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span className="font-light">Aguarde...</span></>
                ) : (
                  <><span>{mode === "register" ? "Criar conta" : "Entrar"}</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Link copiável (admin hint) */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[10px] text-slate-300 uppercase tracking-widest mb-2 font-medium">Link de acesso</p>
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
    </div>
  );
}