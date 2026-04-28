import React, { useState, useEffect } from "react";
import { Mail, ArrowRight, Loader2, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { saveSession, isLoggedIn } from "@/lib/clientPortalSession";
import { isClientPortalPath } from "@/lib/auth-routing";
// Chama clientPortalAuth via SDK — requiresAuth: false está configurado no base44Client
async function callClientPortalAuth(payload) {
  const res = await base44.functions.invoke("clientPortalAuth", payload);
  return res?.data ?? res;
}

/**
 * Tela de login unificada — serve tanto para o Portal do Cliente quanto para
 * usuários internos (Central Destra).
 *
 * Fluxo:
 * 1. Se o destino (next) for o Portal do Cliente → autentica via clientPortalAuth (senha local)
 * 2. Se o destino for a Central Destra (ou sem next) → autentica via base44.auth.loginViaEmailPassword
 *    e redireciona para a rota pedida após login
 *
 * O parâmetro ?next= indica o destino após o login.
 */
export default function Autenticar() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const next = params.get("next") || "";

  const isClientTarget = isClientPortalPath(next);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Já logado no portal do cliente → redireciona direto
    if (isClientTarget && isLoggedIn()) {
      navigate(next || "/ClientPortalDashboard", { replace: true });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (isClientTarget) {
        // Autenticação para o Portal do Cliente — via fetch direto (sem auth de usuário)
        const data = await callClientPortalAuth({
          action: mode,
          email: normalizedEmail,
          password,
          name,
        });

        if (data?.success) {
          saveSession(data.token, data.profile, data.expiresAt);
          navigate(next || "/ClientPortalDashboard", { replace: true });
        } else {
          setError(data?.error || "Erro desconhecido. Tente novamente.");
        }
      } else {
        // Autenticação para usuários internos da Central Destra via Base44 SDK
        await base44.auth.loginViaEmailPassword(normalizedEmail, password);
        // Após login bem-sucedido, navega para o destino pedido ou para a home
        const destination = next || "/";
        window.location.href = destination;
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("credential")) {
        setError("E-mail ou senha inválidos.");
      } else if (msg.toLowerCase().includes("disabled")) {
        setError("Esta conta está desativada.");
      } else {
        setError("Não foi possível entrar agora. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-600 lg:bg-white flex flex-col lg:flex-row">
      {/* ── Left panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-8">
        <div>
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-white text-sm font-light tracking-widest">D</span>
            </div>
            <span className="text-white/60 text-xs tracking-widest uppercase font-light">Destra</span>
          </div>
          <h2 className="text-4xl font-extralight text-white leading-tight mb-4">
            {isClientTarget ? (<>Portal do<br />Cliente</>) : (<>Central<br />Destra</>)}
          </h2>
          <p className="text-slate-400 text-base font-light leading-relaxed">
            {isClientTarget ? (<>Acompanhe seus projetos,<br />aprovações e entregas<br />em tempo real.</>) : (<>Acesse a plataforma interna<br />da equipe Destra.</>)}
          </p>
        </div>
        <div className="space-y-1.5">
          {["Visibilidade completa do projeto", "Aprovação de entregas", "Comunicação direta com a equipe"].map((item, i) => (
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

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 lg:bg-white">
        <div className="w-full max-w-sm md:max-w-lg">

          {/* ── Mobile ── */}
          <div className="lg:hidden p-8 -mx-5 min-h-screen flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <span className="text-white text-lg font-light tracking-widest">D</span>
                </div>
                <p className="text-white/70 text-xs tracking-widest uppercase font-light">Destra</p>
              </div>

              <div className="mb-10">
                <h1 className="text-5xl font-extralight text-white tracking-tight leading-tight mb-4">
                  {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
                </h1>
                <p className="text-white/60 text-lg font-light leading-relaxed">
                  {mode === "login" ? "Acesse seu portal com suas credenciais." : "Registre-se para acessar seu portal."}
                </p>
              </div>

              {/* Mode switcher — só exibe cadastro para portal do cliente */}
              {isClientTarget && (
                <div className="flex gap-2 mb-8 border-b border-white/10">
                  {[{ key: "login", label: "Entrar" }, { key: "register", label: "Cadastrar" }].map(m => (
                    <button key={m.key} type="button" onClick={() => { setMode(m.key); setError(""); }}
                      className={`pb-4 px-2 text-base font-medium transition-all border-b-2 ${mode === m.key ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/60"}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
              {isClientTarget && mode === "register" && (
                <div>
                  <label className="text-sm text-white/70 font-medium block mb-2 tracking-wide">Nome completo</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required
                    className="w-full h-14 px-5 rounded-2xl border border-white/20 bg-white/5 text-white text-base placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all" />
                </div>
              )}

                <div>
                  <label className="text-sm text-white/70 font-medium block mb-2 tracking-wide">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                      className="w-full h-14 pl-14 pr-5 rounded-2xl border border-white/20 bg-white/5 text-white text-base placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/70 font-medium block mb-2 tracking-wide">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"} required minLength={6}
                      className="w-full h-14 pl-14 pr-14 rounded-2xl border border-white/20 bg-white/5 text-white text-base placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
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

                <button type="submit" disabled={loading}
                  className="w-full h-14 bg-white text-slate-950 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3 hover:bg-white/90 transition-colors disabled:opacity-50 mt-2">
                  {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Aguarde...</span></>)
                    : (<><span>{isClientTarget && mode === "register" ? "Criar conta" : "Entrar"}</span><ArrowRight className="w-5 h-5" /></>)}
                </button>
              </form>
            </div>
          </div>

          {/* ── Desktop ── */}
          <div className="hidden lg:block">
            <div className="mb-6">
              <h1 className="text-2xl font-light text-slate-900 mb-1">
                {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
              </h1>
              <p className="text-sm text-slate-400 font-light">
                {mode === "login" ? "Acesse seu portal com suas credenciais." : "Registre-se para acessar seu portal."}
              </p>
            </div>

            {/* Mode switcher — só exibe cadastro para portal do cliente */}
            {isClientTarget && (
              <div className="flex gap-4 mb-5 border-b border-slate-100">
                {[{ key: "login", label: "Entrar" }, { key: "register", label: "Cadastrar" }].map(m => (
                  <button key={m.key} type="button" onClick={() => { setMode(m.key); setError(""); }}
                    className={`pb-3 px-1 text-sm font-medium transition-all border-b-2 ${mode === m.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isClientTarget && mode === "register" && (
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1.5 tracking-wide">Nome completo</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1.5 tracking-wide">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1.5 tracking-wide">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"} required minLength={6}
                    className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
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

              <button type="submit" disabled={loading}
                className="w-full h-11 bg-slate-900 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 mt-1">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /><span className="font-light">Aguarde...</span></>)
                  : (<><span>{isClientTarget && mode === "register" ? "Criar conta" : "Entrar"}</span><ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}