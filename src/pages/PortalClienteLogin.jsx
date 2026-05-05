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
    // Set dark safe areas
    document.documentElement.classList.add("portal-dark");
    document.documentElement.style.backgroundColor = BG;
    document.body.style.backgroundColor = BG;

    if (isLoggedIn()) {
      navigate("/ClientPortalDashboard", { replace: true });
      return;
    }
    // pequeno delay para o navigate terminar antes de animar
    setTimeout(() => setVisible(true), 50);

    return () => {
      document.documentElement.classList.remove("portal-dark");
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
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
    <div
      className="fixed inset-0 overflow-hidden flex flex-col"
      style={{ background: BG }}
    >
      {/* Glow — estende para cima cobrindo a safe area */}
      <div className="absolute pointer-events-none" style={{
        top: "calc(-1 * env(safe-area-inset-top, 0px))",
        left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse 85% 50% at 50% 0%, rgba(59,130,246,0.26) 0%, transparent 65%)"
      }} />

      <motion.div
        className="relative z-10 flex flex-col w-full h-full"
        initial={{ opacity: 0, scale: 1.06, filter: "blur(18px)" }}
        animate={visible
          ? { opacity: 1, scale: 1, filter: "blur(0px)" }
          : { opacity: 0, scale: 1.06, filter: "blur(18px)" }
        }
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── LOGO ── */}
        <div
          className="flex items-center gap-2.5 px-6 flex-shrink-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)", paddingBottom: "8px" }}
        >
          <img
            src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg"
            alt="Destra"
            className="w-6 h-6 brightness-0 invert opacity-60"
          />
          <span className="text-white/35 text-[10px] tracking-[0.22em] uppercase font-medium">
            Portal do Cliente
          </span>
        </div>

        {/* ── MAIN CONTENT — fills remaining space, no scroll ── */}
        <div className="flex-1 flex flex-col justify-end px-6 min-h-0"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
        >
          {/* Title */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.28, ease: IOS }}
              className="mb-5"
            >
              <p className="text-[10px] tracking-[0.22em] uppercase text-white/25 font-medium mb-3">
                {mode === "login" ? "Acesso seguro" : "Criar conta"}
              </p>
              <h1 className="text-[42px] font-extralight text-white tracking-tight leading-[1.08] mb-1.5">
                {mode === "login" ? "Bem-vindo\nde volta" : "Criar\nconta"}
              </h1>
              <p className="text-[13px] font-light text-white/30 leading-relaxed">
                {mode === "login"
                  ? "Acesse para acompanhar seus projetos."
                  : "Registre-se para acessar o portal."}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-0 mb-5 border-b border-white/[0.08]">
            {[{ key: "login", label: "Entrar" }, { key: "register", label: "Cadastrar" }].map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMode(m.key); setError(""); }}
                className={`pb-2.5 px-1 mr-6 text-sm font-medium transition-all border-b-2 -mb-px ${
                  mode === m.key
                    ? "border-white text-white"
                    : "border-transparent text-white/30"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: IOS }}
                  className="overflow-hidden"
                >
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Nome completo" required
                    className="w-full h-[50px] px-4 rounded-2xl border border-white/[0.12] bg-white/[0.06] text-white text-base placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.09] transition-all"
                    style={{ fontSize: "16px" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                className="w-full h-[50px] pl-11 pr-4 rounded-2xl border border-white/[0.12] bg-white/[0.06] text-white text-base placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.09] transition-all"
                style={{ fontSize: "16px" }}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Senha"} required minLength={6}
                className="w-full h-[50px] pl-11 pr-12 rounded-2xl border border-white/[0.12] bg-white/[0.06] text-white text-base placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.09] transition-all"
                style={{ fontSize: "16px" }}
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
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-white text-slate-900 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Aguarde...</span></>
                  : <><span>{mode === "register" ? "Criar conta" : "Entrar"}</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-center text-white/[0.18] text-[10px] tracking-wide font-light mt-5">
            © {new Date().getFullYear()} Destra · Acesso seguro
          </p>
        </div>
      </motion.div>
    </div>
  );
}