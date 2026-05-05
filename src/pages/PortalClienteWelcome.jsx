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

const TRACK_WIDTH = 280;
const THUMB_SIZE = 56;
const MAX_DRAG = TRACK_WIDTH - THUMB_SIZE - 8; // 8px margin

export default function PortalClienteWelcome() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [exiting, setExiting] = useState(false);

  const dragX = useMotionValue(0);

  // Track fill grows as thumb slides right
  const fillWidth = useTransform(dragX, [0, MAX_DRAG], [THUMB_SIZE, TRACK_WIDTH]);
  // Label fades out as thumb moves
  const labelOpacity = useTransform(dragX, [0, MAX_DRAG * 0.5], [1, 0]);
  // Arrow icon fades/rotates on drag
  const arrowOpacity = useTransform(dragX, [MAX_DRAG * 0.6, MAX_DRAG], [1, 0]);

  const triggerExit = () => {
    setExiting(true);
    setTimeout(() => navigate("/PortalClienteLogin"), 500);
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x >= MAX_DRAG * 0.75 || info.velocity.x > 500) {
      animate(dragX, MAX_DRAG, { duration: 0.15 });
      setTimeout(triggerExit, 150);
    } else {
      animate(dragX, 0, { type: "spring", stiffness: 400, damping: 35 });
    }
  };

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.06, filter: "blur(8px)" }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="min-h-screen bg-[#050D1B] flex flex-col overflow-hidden relative select-none"
        >
          {/* Gradient blob — top */}
          <div className="absolute top-0 left-0 right-0 h-[58vh] overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 90% 80% at 50% 5%, #4A8AFF 0%, #1A4FC4 40%, #0A1E5C 70%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 55% 45% at 38% 18%, rgba(200,220,255,0.28) 0%, transparent 60%)",
              }}
            />
          </div>

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-2.5 px-6 pt-14">
            <img
              src="https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/236087060_Simboloazulclaro13.svg"
              alt="Destra"
              className="w-7 h-7 brightness-0 invert"
            />
            <span className="text-white text-sm font-light tracking-widest uppercase opacity-80">
              Destra
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Text content */}
          <div className="relative z-10 px-6 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.38 }}
              >
                <p className="text-white/50 text-sm font-light mb-3 tracking-wide">
                  {SLIDES[slide].tag}
                </p>
                <h1 className="text-white text-[2.6rem] font-extralight leading-tight tracking-tight">
                  {SLIDES[slide].title}{" "}
                  <span className="font-bold">{SLIDES[slide].highlight}</span>{" "}
                  <span className="font-extralight">{SLIDES[slide].tail}</span>
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="relative z-10 flex items-center gap-1.5 px-6 mt-5 mb-7">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === slide ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="relative z-10 flex items-center justify-between px-5 pb-10 pt-2"
            style={{ gap: 16 }}
          >
            {/* Prev / Next arrows */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setSlide((s) => Math.max(0, s - 1))}
                className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (slide < SLIDES.length - 1) setSlide((s) => s + 1);
                }}
                className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-lg hover:bg-white/90 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Slide-to-enter track */}
            <div
              className="relative flex items-center rounded-full overflow-hidden flex-shrink-0"
              style={{
                width: TRACK_WIDTH,
                height: THUMB_SIZE,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {/* Fill bar */}
              <motion.div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{
                  width: fillWidth,
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.06) 100%)",
                }}
              />

              {/* Label */}
              <motion.span
                style={{ opacity: labelOpacity }}
                className="absolute inset-0 flex items-center justify-center text-white/50 text-sm font-light pointer-events-none tracking-wide"
              >
                Deslize para entrar &nbsp;›
              </motion.span>

              {/* Draggable thumb */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: MAX_DRAG }}
                dragElastic={0.05}
                dragMomentum={false}
                style={{ x: dragX, width: THUMB_SIZE, height: THUMB_SIZE - 8, top: 4, left: 4, position: "absolute" }}
                onDragEnd={handleDragEnd}
                className="rounded-full bg-white shadow-xl cursor-grab active:cursor-grabbing flex items-center justify-center text-slate-900 z-10"
                whileTap={{ scale: 0.93 }}
              >
                <motion.div style={{ opacity: arrowOpacity }}>
                  <ArrowRight className="w-5 h-5" strokeWidth={2} />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      ) : (
        // Placeholder mantém a tela preta durante o exit
        <motion.div
          key="exit-bg"
          className="min-h-screen bg-[#050D1B]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        />
      )}
    </AnimatePresence>
  );
}