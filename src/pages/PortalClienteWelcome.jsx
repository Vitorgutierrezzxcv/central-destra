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
    line2Bold: "projetos",
    line2Rest: " em tempo",
    line3: "real.",
  },
  {
    tag: "Entregas e aprovações",
    line1: "Revise e aprove",
    line2Bold: "cada entrega",
    line2Rest: " da sua",
    line3: "equipe.",
  },
  {
    tag: "Comunicação direta",
    line1: "Fale com a equipe",
    line2Bold: "sem",
    line2Rest: " intermediários",
    line3: "pelo portal.",
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

                {/* Headline — mix extralight + bold, igual à inspiração */}
                <h1 className="text-[2.7rem] leading-[1.12] tracking-tight text-white font-extralight">
                  {SLIDES[slide].line1}
                  <br />
                  <span className="font-bold">{SLIDES[slide].line2Bold}</span>
                  <span className="font-extralight">{SLIDES[slide].line2Rest}</span>
                  <br />
                  <span className="font-extralight">{SLIDES[slide].line3}</span>
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

          {/* ── BOTTOM BAR — exatamente como na inspiração ── */}
          <div
            className="relative z-10 flex items-center gap-3 px-5 pt-5 flex-shrink-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)" }}
          >
            {/* Back — círculo branco/ghost */}
            <button
              onClick={goPrev}
              className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
            </button>

            {/* Next — círculo branco sólido */}
            <button
              onClick={goNext}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-900 flex-shrink-0 active:scale-95 transition-transform"
            >
              <ArrowRight className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Start — pill */}
            <button
              onClick={handleStart}
              className="flex-1 h-14 rounded-full bg-white/10 border border-white/15 flex items-center justify-center gap-2 text-white text-base font-light hover:bg-white/15 active:scale-[0.98] transition-all"
            >
              <span>Entrar</span>
              <span className="text-white/40 text-lg leading-none">&rsaquo;&rsaquo;</span>
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