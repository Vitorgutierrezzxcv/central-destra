import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";

const BG = "#0B1628";
const IOS = [0.22, 1, 0.36, 1];

const SLIDES = [
  { tag: "Bem-vindo ao portal", headline: "Acompanhe\nseus projetos", sub: "em tempo real." },
  { tag: "Entregas e aprovações", headline: "Revise e aprove\ncada entrega", sub: "da sua equipe." },
  { tag: "Comunicação direta", headline: "Fale com a equipe\nsem intermediários", sub: "pelo portal." },
];

const TW = 230, TH = 52, M = 5;
const MAX = TW - TH - M * 2;

export default function PortalClienteWelcome() {
  useThemeColor(BG);
  const navigate = useNavigate();

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
  const [slide, setSlide] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const thumbRef = useRef(null);

  const dragX = useMotionValue(0);
  const fillW = useTransform(dragX, [0, MAX], [TH + M * 2, TW]);
  const labelOp = useTransform(dragX, [0, MAX * 0.4], [1, 0]);
  const arrowOp = useTransform(dragX, [MAX * 0.5, MAX], [1, 0]);

  const doExit = () => {
    setLeaving(true);
    setTimeout(() => navigate("/PortalClienteLogin"), 200);
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x >= MAX * 0.7 || info.velocity.x > 480) {
      animate(dragX, MAX, { duration: 0.07 });
      setTimeout(doExit, 50);
    } else {
      animate(dragX, 0, { type: "spring", stiffness: 500, damping: 40 });
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden select-none" style={{ background: BG }}>
      <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ opacity: leaving ? 0 : 1, transition: 'opacity 0.15s' }}>
        {/* Glow */}
        <div className="absolute pointer-events-none" style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(59,130,246,0.32) 0%, transparent 68%)"
        }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5 px-6 flex-shrink-0" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 48px)" }}>
          <img src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg" alt="Destra" className="w-7 h-7 brightness-0 invert opacity-60" />
          <span className="text-white/35 text-[10px] tracking-[0.22em] uppercase font-medium">Portal do Cliente</span>
        </div>

        <div className="flex-1 min-h-0" />

        {/* Text */}
        <div className="relative z-10 px-6 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div key={slide} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: IOS }}>
              <p className="text-[10px] tracking-[0.22em] uppercase text-white/25 font-medium mb-4">{SLIDES[slide].tag}</p>
              <h1 className="font-extralight text-white tracking-tight leading-[1.0] mb-3">
                {SLIDES[slide].headline.split("\n").map((line, i) => (
                  <span key={i} style={{ fontSize: slide === 0 ? (i === 0 ? "3.2rem" : "4.2rem") : "3.2rem", display: "block", lineHeight: 1.05 }}>{line}</span>
                ))}
              </h1>
              <p className="text-xl font-light text-white/25 leading-relaxed mt-3">{SLIDES[slide].sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="relative z-10 flex items-center gap-2 px-6 mt-7 flex-shrink-0">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? 22 : 6,
              height: 3,
              backgroundColor: i === slide ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.18)",
              transition: 'all 0.2s',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer'
            }} />
          ))}
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center gap-3 px-5 pt-6 flex-shrink-0" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 36px)" }}>
          <button onClick={() => setSlide((s) => Math.max(0, s - 1))} className="w-[52px] h-[62px] rounded-2xl border border-white/[0.09] flex items-center justify-center text-white/25 active:opacity-60 flex-shrink-0 transition-opacity">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button onClick={() => { if (slide < SLIDES.length - 1) setSlide((s) => s + 1); }} className="w-[52px] h-[62px] rounded-2xl bg-white/[0.07] border border-white/[0.09] flex items-center justify-center text-white/50 active:opacity-60 flex-shrink-0 transition-opacity">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Slide to enter */}
          <div style={{ height: TH + M * 2, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", position: "relative", borderRadius: '1rem', overflow: 'hidden', flex: 1 }}>
            <motion.div className="absolute left-0 top-0 bottom-0 rounded-2xl" style={{ width: fillW, background: "rgba(59,130,246,0.22)" }} />
            <motion.span style={{ opacity: labelOp, paddingLeft: TH + M * 2 + 4 }} className="absolute inset-0 flex items-center justify-center text-white text-[13px] font-light pointer-events-none tracking-wide z-0">Deslize para entrar →</motion.span>
            <motion.div
              ref={thumbRef}
              drag="x"
              dragConstraints={{ left: 0, right: MAX }}
              dragElastic={0.02}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              style={{
                x: dragX,
                position: "absolute",
                left: M,
                top: M,
                width: TH,
                height: TH,
              }}
              className="rounded-xl bg-white cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
            >
              <ArrowRight className="w-[18px] h-[18px] text-slate-800" strokeWidth={2.5} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}