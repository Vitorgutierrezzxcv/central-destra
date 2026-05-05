import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";

const BG = "#0a0a0f";

const SLIDES = [
  {
    tag: "Bem-vindo ao portal",
    line1: "Acompanhe seus",
    line2: "projetos.",
    line2Bold: true,
  },
  {
    tag: "Entregas e aprovações",
    line1: "Revise e aprove",
    line2: "cada entrega.",
    line2Bold: true,
  },
  {
    tag: "Comunicação direta",
    line1: "Fale sem",
    line2: "intermediários",
    line3: "pelo portal.",
    line2Bold: true,
  },
];

export default function PortalClienteWelcome() {
  useThemeColor(BG);
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [exiting, setExiting] = useState(false);

  const goNext = () => {
    if (slide < SLIDES.length - 1) setSlide((s) => s + 1);
  };
  const goPrev = () => setSlide((s) => Math.max(0, s - 1));

  const handleStart = () => {
    setExiting(true);
    setTimeout(() => navigate("/PortalClienteLogin"), 420);
  };

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.38 }}
          className="fixed inset-0 flex flex-col overflow-hidden select-none"
          style={{ background: BG }}
        >
          {/* ── GLOW BLOB — preenche toda a metade superior ── */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{ height: "58%" }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 110% 90% at 50% 10%, rgba(80,120,255,0.95) 0%, rgba(40,80,220,0.80) 28%, rgba(20,40,140,0.50) 55%, transparent 78%)",
              }}
            />
          </div>

          {/* ── LOGO ── */}
          <div
            className="relative z-10 flex items-center gap-2 px-6 flex-shrink-0"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 44px)" }}
          >
            <img
              src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg"
              alt="Destra"
              className="w-6 h-6 brightness-0 invert opacity-90"
            />
            <span className="text-white/60 text-[11px] tracking-[0.18em] uppercase font-medium">
              Destra
            </span>
          </div>

          {/* ── SPACER ── */}
          <div className="flex-1 min-h-0" />

          {/* ── TEXTO PRINCIPAL ── */}
          <div className="relative z-10 px-6 flex-shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
              >
                {/* Tag label */}
                <p className="text-white/50 text-sm font-light mb-3">
                  {SLIDES[slide].tag}
                </p>

                {/* Headline — linha 1 menor (extralight), linha 2 maior (bold) */}
                <h1 className="tracking-tight text-white">
                  <span className="block text-[2.1rem] leading-[1.15] font-extralight opacity-70">
                    {SLIDES[slide].line1}
                  </span>
                  <span className="block text-[3rem] leading-[1.1] font-bold">
                    {SLIDES[slide].line2}
                  </span>
                  {SLIDES[slide].line3 && (
                    <span className="block text-[3rem] leading-[1.1] font-bold">
                      {SLIDES[slide].line3}
                    </span>
                  )}
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── DOTS ── */}
          <div className="relative z-10 flex items-center gap-1.5 px-6 mt-5 flex-shrink-0">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setSlide(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === slide ? "w-5 h-[3px] bg-white" : "w-[5px] h-[5px] bg-white/25"
                }`}
              />
            ))}
          </div>

          {/* ── BOTTOM BAR ── */}
          <div
            className="relative z-10 flex items-center gap-3 px-5 pt-5 flex-shrink-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)" }}
          >
            {/* Back — círculo ghost */}
            <button
              onClick={goPrev}
              className="w-14 h-14 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/30 active:scale-95 transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={1.6} />
            </button>

            {/* Next — círculo branco sólido */}
            <button
              onClick={goNext}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-lg flex-shrink-0 active:scale-95 transition-transform"
            >
              <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2.2} />
            </button>

            {/* Entrar — pill com label + seta dupla */}
            <button
              onClick={handleStart}
              className="flex-1 h-14 rounded-full flex items-center justify-between px-5 active:scale-[0.97] transition-transform"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span className="text-white text-[15px] font-light tracking-wide">Entrar</span>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
                <ArrowRight className="w-4 h-4 text-white/70" strokeWidth={1.8} />
              </div>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="exit"
          className="fixed inset-0"
          style={{ background: BG }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.06 }}
        />
      )}
    </AnimatePresence>
  );
}