import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";

const BG = "#0B1628";
const IOS = [0.22, 1, 0.36, 1];

const SLIDES = [
  { tag: "Bem-vindo ao portal", headline: "Acompanhe seus projetos", sub: "em tempo real." },
  { tag: "Entregas e aprovações", headline: "Revise e aprove\ncada entrega", sub: "da sua equipe." },
  { tag: "Comunicação direta", headline: "Fale com a equipe\nsem intermediários", sub: "pelo portal." },
];

const TW = 230, TH = 52, M = 5;
const MAX = TW - TH - M * 2;

export default function PortalClienteWelcome() {
  useThemeColor(BG);
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const thumbRef = useRef(null);

  const dragX = useMotionValue(0);
  const fillW = useTransform(dragX, [0, MAX], [TH + M * 2, TW]);
  const labelOp = useTransform(dragX, [0, MAX * 0.4], [1, 0]);
  const arrowOp = useTransform(dragX, [MAX * 0.5, MAX], [1, 0]);
  const thumbScale = useTransform(dragX, [0, MAX], [1, 1.08]);
  const thumbShadow = useTransform(
    dragX,
    [0, MAX],
    ["0 2px 8px rgba(0,0,0,0.2)", "0 0 32px rgba(99,179,237,0.7), 0 2px 8px rgba(0,0,0,0.2)"]
  );

  const doExit = () => {
    setLeaving(true);
    // Navigate after the white flash covers everything
    setTimeout(() => navigate("/PortalClienteLogin"), 520);
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

      {/* ── WHITE FLASH that covers screen then reveals login ── */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            key="flash"
            className="fixed inset-0 z-[100]"
            style={{ background: "#ffffff" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1] }}
            transition={{ duration: 0.45, times: [0, 0.4, 1], ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* ── PAGE CONTENT — scales down when leaving ── */}
      <motion.div
        className="fixed inset-0 flex flex-col overflow-hidden"
        animate={leaving
          ? { scale: 0.92, opacity: 0, filter: "blur(6px)" }
          : { scale: 1, opacity: 1, filter: "blur(0px)" }
        }
        transition={leaving
          ? { duration: 0.38, ease: IOS }
          : { duration: 0 }
        }
      >
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 90% 60% at 50% -5%, rgba(59,130,246,0.28) 0%, transparent 70%)"
        }} />

        {/* Logo */}
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
            Portal do Cliente
          </span>
        </motion.div>

        <div className="flex-1 min-h-0" />

        {/* Text */}
        <div className="relative z-10 px-6 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: IOS }}
            >
              <p className="text-[10px] tracking-[0.22em] uppercase text-white/25 font-medium mb-4">
                {SLIDES[slide].tag}
              </p>
              <h1 className="text-5xl font-extralight text-white tracking-tight leading-[1.08] mb-3">
                {SLIDES[slide].headline.split("\n").map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </h1>
              <p className="text-xl font-light text-white/25 leading-relaxed">
                {SLIDES[slide].sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <motion.div
          className="relative z-10 flex items-center gap-2 px-6 mt-7 flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setSlide(i)}
              animate={{
                width: i === slide ? 22 : 6,
                height: 3,
                backgroundColor: i === slide ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.18)",
              }}
              transition={{ duration: 0.28, ease: IOS }}
              className="rounded-full flex-shrink-0 origin-left"
            />
          ))}
        </motion.div>

        {/* Bottom */}
        <motion.div
          className="relative z-10 flex items-center gap-3 px-5 pt-6 flex-shrink-0"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 36px)" }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: IOS, delay: 0.15 }}
        >
          {/* Prev */}
          <button
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            className="w-[52px] h-[62px] rounded-2xl border border-white/[0.09] flex items-center justify-center text-white/25 active:opacity-60 flex-shrink-0 transition-opacity"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Next */}
          <button
            onClick={() => { if (slide < SLIDES.length - 1) setSlide((s) => s + 1); }}
            className="w-[52px] h-[62px] rounded-2xl bg-white/[0.07] border border-white/[0.09] flex items-center justify-center text-white/50 active:opacity-60 flex-shrink-0 transition-opacity"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Slide to enter */}
          <div
            className="relative flex items-center rounded-2xl overflow-hidden flex-1"
            style={{
              height: TH + M * 2,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <motion.div
              className="absolute left-0 top-0 bottom-0 rounded-2xl"
              style={{ width: fillW, background: "rgba(59,130,246,0.22)" }}
            />
            <motion.span
              style={{ opacity: labelOp, paddingLeft: TH + M * 2 + 8 }}
              className="absolute inset-0 flex items-center text-white text-[13px] font-light pointer-events-none tracking-wide z-0"
            >
              Deslize para entrar →
            </motion.span>
            <motion.div
              ref={thumbRef}
              drag="x"
              dragConstraints={{ left: 0, right: MAX }}
              dragElastic={0.02}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              style={{
                x: dragX,
                scale: thumbScale,
                boxShadow: thumbShadow,
                position: "absolute",
                left: M,
                top: M,
                width: TH,
                height: TH,
              }}
              className="rounded-xl bg-white cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
              whileTap={{ scale: 0.87 }}
            >
              <motion.div style={{ opacity: arrowOp }}>
                <ArrowRight className="w-[18px] h-[18px] text-slate-800" strokeWidth={2.5} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}