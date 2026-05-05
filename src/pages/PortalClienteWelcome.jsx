import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";

const BG = "#0B1628";

const SLIDES = [
  { tag: "Bem-vindo ao portal", headline: "Acompanhe seus\nprojetos", sub: "em tempo real." },
  { tag: "Entregas e aprovações", headline: "Revise e aprove\ncada entrega", sub: "da sua equipe." },
  { tag: "Comunicação direta", headline: "Fale com a equipe\nsem intermediários", sub: "pelo portal." },
];

const TRACK_W = 230;
const THUMB = 52;
const M = 5;
const MAX_DRAG = TRACK_W - THUMB - M * 2;

// Ease idêntico ao iOS spring: rápido para fora, amortece no fim
const IOS_EASE = [0.22, 1, 0.36, 1];

export default function PortalClienteWelcome() {
  useThemeColor(BG);

  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | expanding | done
  const thumbRef = useRef(null);
  const [originPct, setOriginPct] = useState({ x: 50, y: 100 });

  const dragX = useMotionValue(0);
  const fillWidth = useTransform(dragX, [0, MAX_DRAG], [THUMB + M * 2, TRACK_W]);
  const labelOpacity = useTransform(dragX, [0, MAX_DRAG * 0.4], [1, 0]);
  const arrowOpacity = useTransform(dragX, [MAX_DRAG * 0.5, MAX_DRAG], [1, 0]);
  // Thumb glows blue as it slides
  const thumbGlow = useTransform(dragX, [0, MAX_DRAG], [0, 1]);

  const triggerExit = () => {
    // Calculate origin from thumb position for the iris
    if (thumbRef.current) {
      const rect = thumbRef.current.getBoundingClientRect();
      const cx = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      const cy = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
      setOriginPct({ x: cx, y: cy });
    }
    setPhase("expanding");
    setTimeout(() => navigate("/PortalClienteLogin"), 680);
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x >= MAX_DRAG * 0.72 || info.velocity.x > 500) {
      animate(dragX, MAX_DRAG, { duration: 0.08 });
      setTimeout(triggerExit, 60);
    } else {
      animate(dragX, 0, { type: "spring", stiffness: 480, damping: 38 });
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: BG }}>

      {/* ── IRIS OVERLAY — expande do ponto do thumb ── */}
      <AnimatePresence>
        {phase === "expanding" && (
          <motion.div
            key="iris"
            className="absolute z-50 rounded-full"
            style={{
              background: "#0B1628",
              left: `${originPct.x}%`,
              top: `${originPct.y}%`,
              translateX: "-50%",
              translateY: "-50%",
              width: 60,
              height: 60,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 60, opacity: 1 }}
            transition={{ duration: 0.62, ease: IOS_EASE }}
          />
        )}
      </AnimatePresence>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <motion.div
        className="fixed inset-0 flex flex-col overflow-hidden select-none"
        style={{ background: BG }}
        animate={phase === "expanding" ? { scale: 1.06, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={
          phase === "expanding"
            ? { duration: 0.5, ease: IOS_EASE }
            : { duration: 0 }
        }
      >
        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: "45%" }}>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 80% at 50% -10%, rgba(59,130,246,0.25) 0%, rgba(30,64,175,0.12) 55%, transparent 80%)",
            }}
          />
        </div>

        {/* ── LOGO ── */}
        <motion.div
          className="relative z-10 flex items-center gap-2.5 px-6 flex-shrink-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 44px)" }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: IOS_EASE, delay: 0.05 }}
        >
          <img
            src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg"
            alt="Destra"
            className="w-7 h-7 brightness-0 invert opacity-70"
          />
          <span className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-medium">
            Portal do Cliente
          </span>
        </motion.div>

        {/* ── SPACER ── */}
        <div className="flex-1 min-h-0" />

        {/* ── TEXTO PRINCIPAL ── */}
        <div className="relative z-10 px-6 flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 22, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
              transition={{ duration: 0.38, ease: IOS_EASE }}
            >
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-medium mb-4">
                {SLIDES[slide].tag}
              </p>
              <h1 className="text-6xl font-extralight text-white tracking-tight leading-[1.1] mb-3">
                {SLIDES[slide].headline.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </h1>
              <p className="text-xl font-light text-white/30 leading-relaxed">
                {SLIDES[slide].sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── DOTS ── */}
        <motion.div
          className="relative z-10 flex items-center gap-1.5 px-6 mt-6 flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {SLIDES.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setSlide(i)}
              animate={{
                width: i === slide ? 20 : 6,
                height: i === slide ? 3 : 6,
                backgroundColor: i === slide ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.2)",
              }}
              transition={{ duration: 0.3, ease: IOS_EASE }}
              className="rounded-full flex-shrink-0"
            />
          ))}
        </motion.div>

        {/* ── BOTTOM BAR ── */}
        <motion.div
          className="relative z-10 flex items-center gap-3 px-5 pt-5 flex-shrink-0"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: IOS_EASE, delay: 0.12 }}
        >
          {/* Prev */}
          <button
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            className="w-[52px] h-[62px] rounded-2xl border border-white/10 flex items-center justify-center text-white/30 hover:text-white/60 flex-shrink-0 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Next */}
          <button
            onClick={() => { if (slide < SLIDES.length - 1) setSlide((s) => s + 1); }}
            className="w-[52px] h-[62px] rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/12 flex-shrink-0 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Slide-to-enter */}
          <div
            className="relative flex items-center rounded-2xl overflow-hidden flex-1"
            style={{
              height: THUMB + M * 2,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Fill */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 rounded-2xl"
              style={{ width: fillWidth, background: "rgba(59,130,246,0.20)" }}
            />

            {/* Label */}
            <motion.span
              style={{ opacity: labelOpacity }}
              className="absolute inset-0 flex items-center justify-center text-white/30 text-sm font-light pointer-events-none tracking-wide"
            >
              Deslize para entrar &nbsp;›
            </motion.span>

            {/* Thumb */}
            <motion.div
              ref={thumbRef}
              drag="x"
              dragConstraints={{ left: 0, right: MAX_DRAG }}
              dragElastic={0.03}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              style={{
                x: dragX,
                position: "absolute",
                left: M,
                top: M,
                width: THUMB,
                height: THUMB,
                boxShadow: useTransform(
                  thumbGlow,
                  [0, 1],
                  ["0 2px 12px rgba(0,0,0,0.25)", "0 0 24px rgba(59,130,246,0.55), 0 2px 12px rgba(0,0,0,0.25)"]
                ),
              }}
              className="rounded-xl bg-white cursor-grab active:cursor-grabbing flex items-center justify-center text-slate-900 z-10"
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <motion.div style={{ opacity: arrowOpacity }}>
                <ArrowRight className="w-5 h-5" strokeWidth={2.2} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}