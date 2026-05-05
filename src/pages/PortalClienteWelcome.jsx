import React, { useState } from "react";
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

export default function PortalClienteWelcome() {
  useThemeColor(BG);

  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [exiting, setExiting] = useState(false);

  const dragX = useMotionValue(0);
  const fillWidth = useTransform(dragX, [0, MAX_DRAG], [THUMB + M * 2, TRACK_W]);
  const labelOpacity = useTransform(dragX, [0, MAX_DRAG * 0.4], [1, 0]);
  const arrowOpacity = useTransform(dragX, [MAX_DRAG * 0.5, MAX_DRAG], [1, 0]);

  const triggerExit = () => {
    setExiting(true);
    setTimeout(() => navigate("/PortalClienteLogin"), 460);
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x >= MAX_DRAG * 0.72 || info.velocity.x > 500) {
      animate(dragX, MAX_DRAG, { duration: 0.1 });
      setTimeout(triggerExit, 90);
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
          exit={{ opacity: 0, scale: 1.03, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 flex flex-col overflow-hidden select-none"
          style={{ background: BG }}
        >
          {/* Top glow */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{ height: "45%" }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 90% 80% at 50% -10%, rgba(59,130,246,0.25) 0%, rgba(30,64,175,0.12) 55%, transparent 80%)",
              }}
            />
          </div>

          {/* ── LOGO ── */}
          <div
            className="relative z-10 flex items-center gap-2.5 px-6 flex-shrink-0"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 44px)" }}
          >
            <img
              src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg"
              alt="Destra"
              className="w-7 h-7 brightness-0 invert opacity-70"
            />
            <span className="text-white/40 text-[10px] tracking-[0.2em] uppercase font-medium">
              Portal do Cliente
            </span>
          </div>

          {/* ── SPACER ── */}
          <div className="flex-1 min-h-0" />

          {/* ── TEXTO PRINCIPAL — mesma estética do dashboard ── */}
          <div className="relative z-10 px-6 flex-shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Label estilo portal */}
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-medium mb-4">
                  {SLIDES[slide].tag}
                </p>

                {/* Headline grande — mesma escala do "Olá, [nome]" do dashboard */}
                <h1 className="text-6xl font-extralight text-white tracking-tight leading-[1.1] mb-3">
                  {SLIDES[slide].headline.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < SLIDES[slide].headline.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </h1>

                {/* Sub em cor apagada */}
                <p className="text-xl font-light text-white/30 leading-relaxed">
                  {SLIDES[slide].sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── DOTS ── */}
          <div className="relative z-10 flex items-center gap-1.5 px-6 mt-6 flex-shrink-0">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === slide ? "w-5 h-[3px] bg-white" : "w-[6px] h-[6px] bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* ── BOTTOM BAR ── */}
          <div
            className="relative z-10 flex items-center gap-3 px-5 pt-5 flex-shrink-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
          >
            {/* Botões prev/next */}
            <button
              onClick={() => setSlide((s) => Math.max(0, s - 1))}
              className="w-[52px] h-[62px] rounded-2xl border border-white/10 flex items-center justify-center text-white/30 hover:text-white/60 flex-shrink-0 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              onClick={() => { if (slide < SLIDES.length - 1) setSlide((s) => s + 1); }}
              className="w-[52px] h-[62px] rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/12 flex-shrink-0 transition-all"
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
              <motion.div
                className="absolute left-0 top-0 bottom-0 rounded-2xl"
                style={{ width: fillWidth, background: "rgba(59,130,246,0.18)" }}
              />

              <motion.span
                style={{ opacity: labelOpacity }}
                className="absolute inset-0 flex items-center justify-center text-white/30 text-sm font-light pointer-events-none tracking-wide"
              >
                Deslize para entrar &nbsp;›
              </motion.span>

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
                whileTap={{ scale: 0.91 }}
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