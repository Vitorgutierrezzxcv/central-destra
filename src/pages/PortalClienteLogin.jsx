import React, { useState, useEffect } from "react";
import { Mail, ArrowRight, Loader2, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { saveSession, isLoggedIn } from "@/lib/clientPortalSession";
import { useThemeColor } from "@/hooks/useThemeColor";

const BG = "#0B1628";
const IOS = [0.22, 1, 0.36, 1];

async function callAuth(payload) {
  const res = await base44.functions.invoke("clientPortalAuth", payload);
  return res?.data ?? res;
}

export default function PortalClienteLogin() {
  useThemeColor(BG);
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/ClientPortalDashboard", { replace: true });
      return;
    }
    // Slight delay so the white-flash from Welcome can clear
    setTimeout(() => setVisible(true), 80);
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
      setError(err?.response?.data?.error || err?.message || "Erro ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // White base that clears the flash bg from Welcome
    <div className="fixed inset-0 overflow-hidden" style={{ background: BG }}>
      <motion.div
        className="fixed inset-0 flex flex-col overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.55, ease: IOS }}
      >
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 85% 55% at 50% -5%, rgba(59,130,246,0.22) 0%, transparent 65%)"
        }} />

        {/* Logo */}
        <div
          className="relative z-10 flex items-center gap-2.5 px-6 flex-shrink-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 48px)" }}
        >
          <img
            src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg"
            alt="Destra"
            className="w-7 h-7 brightness-0 invert opacity-60"
          />
          <span className="text-white/35 text-[10px] tracking-[0.22em] uppercase font-medium">
            Portal do Cliente
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-h-0" />

        {/* Content area */}
        <div className="relative z-10 px-6 flex-shrink-0">
          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: IOS }}
            >
              <p className="text-[10px] tracking-[0.22em] uppercase text-white/25 font-medium mb-4">
                {mode === "login" ? "Acesso seguro" : "Criar conta"}
              </p>
              <h1 className="text-5xl font-extralight text-white tracking-tight leading-[1.1] mb-2">
                {mode === "login" ? "Bem-vindo\nde volta" : "Criar\nconta"}
              </h1>
              <p className="text-base font-light text-white/30 leading-relaxed mb-6">
                {mode === "login"
                  ? "Acesse para acompanhar seus projetos."
                  : "Registre-se para acessar o portal."}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-0 mb-6 border-b border-white/[0.08]">
            {[{ key: "login", label: "Entrar" }, { key: "register", label: "Cadastrar" }].map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMode(m.key); setError(""); }}
                className={`pb-3 px-1 mr-6 text-sm font-medium transition-all border-b-2 -mb-px ${
                  mode === m.key
                    ? "border-white text-white"
                    : "border-transparent text-white/30 hover:text-white/50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: IOS }}
                  className="overflow-hidden"
                >
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Nome completo" required
                    className="w-full h-[52px] px-4 rounded-2xl border border-white/[0.12] bg-white/[0.06] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.09] transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                className="w-full h-[52px] pl-11 pr-4 rounded-2xl border border-white/[0.12] bg-white/[0.06] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.09] transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Senha"} required minLength={6}
                className="w-full h-[52px] pl-11 pr-12 rounded-2xl border border-white/[0.12] bg-white/[0.06] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.09] transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-white text-slate-900 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2.5 hover:bg-white/92 active:scale-[0.98] transition-all disabled:opacity-40 mt-1"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Aguarde...</span></>
                : <><span>{mode === "register" ? "Criar conta" : "Entrar"}</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          className="relative z-10 flex-shrink-0 text-center"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)", paddingTop: "20px" }}
        >
          <p className="text-white/[0.18] text-[10px] tracking-wide font-light">
            © {new Date().getFullYear()} Destra · Acesso seguro
          </p>
        </div>
      </motion.div>
    </div>
  );
}