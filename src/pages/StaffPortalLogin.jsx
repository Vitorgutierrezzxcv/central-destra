import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThemeColor } from "@/hooks/useThemeColor";
import { motion } from "framer-motion";

const BG = "#0B1628";
const IOS = [0.22, 1, 0.36, 1];

export default function StaffPortalLogin() {
  useThemeColor(BG);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("portal-dark");
    document.documentElement.style.backgroundColor = BG;
    document.body.style.backgroundColor = BG;
    return () => {
      document.documentElement.classList.remove("portal-dark");
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Add login logic here
    setTimeout(() => {
      navigate("/Dashboard");
    }, 1000);
  };

  return (
    <div className="fixed inset-0 overflow-hidden select-none flex flex-col" style={{ background: BG }}>
      {/* Glow */}
      <div className="absolute pointer-events-none" style={{
        top: "calc(-1 * env(safe-area-inset-top, 0px))",
        left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(59,130,246,0.32) 0%, transparent 68%)"
      }} />

      <motion.div
        className="relative z-10 flex items-center gap-2.5 px-6 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 48px)" }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: IOS, delay: 0.05 }}
      >
        <img
          src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg"
          alt="Destra"
          className="w-7 h-7 brightness-0 invert opacity-60"
        />
        <span className="text-white/35 text-[10px] tracking-[0.22em] uppercase font-medium">
          Central de Funcionários
        </span>
      </motion.div>

      <div className="flex-1 flex flex-col justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: IOS, delay: 0.1 }}
        >
          <h1 className="text-white text-3xl font-extralight mb-2 tracking-tight">
            Bem-vindo de volta
          </h1>
          <p className="text-white/25 text-sm mb-8">
            Entre com sua conta para acessar a central
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="seu.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 px-6 flex-shrink-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 36px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <button
          onClick={() => navigate("/StaffPortalWelcome")}
          className="text-white/35 text-xs hover:text-white/50 transition-colors"
        >
          ← Voltar
        </button>
      </motion.div>
    </div>
  );
}