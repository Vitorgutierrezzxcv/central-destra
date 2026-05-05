import React, { useState, useEffect } from "react";
import { Mail, ArrowRight, Loader2, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 56, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-[#0B1628] flex flex-col lg:flex-row"
    >
      {/* Left panel — desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0D1E38]/60 border-r border-white/5 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2.5 mb-14">
            <img src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg" alt="Destra" className="w-8 h-8 brightness-0 invert opacity-80" />
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
        <div className="space-y-1.5">
          {["Visibilidade completa do projeto", "Aprovação de entregas", "Comunicação direta com a equipe"].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/40" />
              <p className="text-slate-400 text-sm font-light">{item}</p>
            </div>
          ))}
          <p className="text-slate-600 text-xs mt-6 font-light tracking-wide">© {new Date().getFullYear()} Destra · Acesso seguro</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <img src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg" alt="Destra" className="w-10 h-10 brightness-0 invert opacity-80" />
            <p className="text-white/70 text-xs tracking-widest uppercase font-light">Portal do Cliente</p>
          </div>

          <div className="mb-10">
            <h1 className="text-5xl font-extralight text-white tracking-tight leading-tight mb-4">
              {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </h1>
            <p className="text-white/60 text-lg font-light leading-relaxed">
              {mode === "login"
                ? "Acesse o portal para acompanhar seus projetos e entregas."
                : "Registre-se para acessar o portal."}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-8 border-b border-white/10">
            {[{ key: "login", label: "Entrar" }, { key: "register", label: "Cadastrar" }].map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMode(m.key); setError(""); }}
                className={`pb-4 px-2 text-base font-medium transition-all border-b-2 ${
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
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo" required
                  className="w-full h-14 px-5 rounded-2xl border border-white/20 bg-white/5 text-white text-base placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-white/70 font-medium block mb-2 tracking-wide">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" required
                  className="w-full h-14 pl-14 pr-5 rounded-2xl border border-white/20 bg-white/5 text-white text-base placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-white/70 font-medium block mb-2 tracking-wide">Senha</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"} required minLength={6}
                  className="w-full h-14 pl-14 pr-14 rounded-2xl border border-white/20 bg-white/5 text-white text-base placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
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
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Aguarde...</span></>
                : <><span>{mode === "register" ? "Criar conta" : "Entrar"}</span><ArrowRight className="w-5 h-5" /></>
              }
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}