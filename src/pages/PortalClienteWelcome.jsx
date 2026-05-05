import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";

const BG = "#0B1628";

const SLIDES = [
  {
    tag: "Bem-vindo ao portal",
    title: "Acompanhe seus projetos",
    highlight: "em tempo real",
    tail: "com total transparência.",
  },
  {
    tag: "Entregas e aprovações",
    title: "Revise e aprove",
    highlight: "cada entrega",
    tail: "da sua equipe.",
  },
  {
    tag: "Comunicação direta",
    title: "Fale com a equipe",
    highlight: "sem intermediários",
    tail: "pelo portal.",
  },
];

const TRACK_W = 240;
const THUMB = 48;
const M = 4;
const MAX_DRAG = TRACK_W - THUMB - M * 2;

export default function PortalClienteWelcome() {
  useThemeColor(BG);

  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [exiting, setExiting] = useState(false);

  const dragX = useMotionValue(0);
  const fillWidth = useTransform(dragX, [0, MAX_DRAG], [THUMB + M * 2, TRACK_W]);
  const labelOpacity = useTransform(dragX, [0, MAX_DRAG * 0.45], [1, 0]);
  const arrowOpacity = useTransform(dragX, [MAX_DRAG * 0.55, MAX_DRAG], [1, 0]);

  const triggerExit = () => {
    setExiting(true);
    setTimeout(() => navigate("/PortalClienteLogin"), 460);
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x >= MAX_DRAG * 0.72 || info.velocity.x > 500) {
      animate(dragX, MAX_DRAG, { duration: 0.12 });
      setTimeout(triggerExit, 100);
    } else {
      animate(dragX, 0, { type: "spring", stiffness: 420, damping: 36 });
    }
  };

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
          transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 flex flex-col select-none overflow-hidden"
          style={{ background: BG }}
        >
          {/* Top glow */}
          <div className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 85% 75% at 50% -5%, rgba(59,130,246,0.30) 0%, rgba(30,64,175,0.14) 50%, transparent 78%)",
              }}
            />
          </div>

          {/* Logo */}
          <div
            className="relative z-10 flex items-center gap-2.5 px-6 flex-shrink-0"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 48px)" }}
          >
            <img
              src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg"
              alt="Destra"
              className="w-8 h-8 brightness-0 invert opacity-80"
            />
            <span className="text-white/60 text-xs tracking-widest uppercase font-light">
              Portal do Cliente
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-0" />

          {/* Text content */}
          <div className="relative z-10 px-6 flex-shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.34 }}
              >
                <p className="text-blue-400/70 text-sm font-light mb-2.5 tracking-wide">
                  {SLIDES[slide].tag}
                </p>
                <h1 className="text-white text-[2.2rem] font-extralight leading-tight tracking-tight">
                  {SLIDES[slide].title}{" "}
                  <span className="font-bold">{SLIDES[slide].highlight}</span>{" "}
                  <span className="font-extralight opacity-70">{SLIDES[slide].tail}</span>
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Feature bullets */}
          <div className="relative z-10 px-6 mt-5 flex-shrink-0 space-y-2">
            {[
              "Visibilidade completa do projeto",
              "Aprovação de entregas",
              "Comunicação direta com a equipe",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/40 flex-shrink-0" />
                <p className="text-slate-400 text-sm font-light">{item}</p>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="relative z-10 flex items-center gap-1.5 px-6 mt-5 flex-shrink-0">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === slide ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="relative z-10 flex items-center justify-between px-5 pt-4 flex-shrink-0 gap-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)" }}
          >
            {/* Prev / Next */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setSlide((s) => Math.max(0, s - 1))}
                className="w-11 h-11 rounded-2xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/25 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => { if (slide < SLIDES.length - 1) setSlide((s) => s + 1); }}
                className="w-11 h-11 rounded-2xl bg-white/10 border border-white/[0.15] flex items-center justify-center text-white hover:bg-white/15 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Slide-to-enter track */}
            <div
              className="relative flex items-center rounded-2xl overflow-hidden flex-1"
              style={{
                height: THUMB + M * 2,
                maxWidth: TRACK_W,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              {/* Fill */}
              <motion.div
                className="absolute left-0 top-0 bottom-0 rounded-2xl"
                style={{
                  width: fillWidth,
                  background: "rgba(59,130,246,0.20)",
                }}
              />

              {/* Label */}
              <motion.span
                style={{ opacity: labelOpacity }}
                className="absolute inset-0 flex items-center justify-center text-white/40 text-sm font-light pointer-events-none tracking-wide"
              >
                Deslize para entrar &nbsp;›
              </motion.span>

              {/* Thumb */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: MAX_DRAG }}
                dragElastic={0.04}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                style={{
                  x: dragX,
                  position: "absolute",
                  left: M,
                  top: M,
                  width: THUMB,
                  height: THUMB,
                }}
                className="rounded-xl bg-white shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center text-slate-900 z-10"
                whileTap={{ scale: 0.92 }}
              >
                <motion.div style={{ opacity: arrowOpacity }}>
                  <ArrowRight className="w-5 h-5" strokeWidth={2} />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="exit-bg"
          className="fixed inset-0"
          style={{ background: BG }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.08 }}
        />
      )}
    </AnimatePresence>
  );
}