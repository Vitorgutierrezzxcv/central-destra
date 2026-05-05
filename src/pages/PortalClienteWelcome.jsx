import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { ChevronDown } from "lucide-react";

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

export default function PortalClienteWelcome() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);

  // Drag-to-enter logic
  const dragY = useMotionValue(0);
  const btnOpacity = useTransform(dragY, [0, 100], [1, 0.3]);
  const btnScale = useTransform(dragY, [0, 80], [1, 0.9]);
  const overlayOpacity = useTransform(dragY, [0, 120], [0, 0.6]);

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 90 || info.velocity.y > 400) {
      animate(dragY, 300, { duration: 0.3 });
      setTimeout(() => navigate("/PortalClienteLogin"), 280);
    } else {
      animate(dragY, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  const goToLogin = () => {
    animate(dragY, 300, { duration: 0.25 });
    setTimeout(() => navigate("/PortalClienteLogin"), 240);
  };

  return (
    <div className="min-h-screen bg-[#050D1B] flex flex-col overflow-hidden relative select-none">

      {/* Gradient blob — top */}
      <div className="absolute top-0 left-0 right-0 h-[55vh] overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 70% at 50% 10%, #3B7BFF 0%, #1A4FC4 35%, #0A1E5C 65%, transparent 100%)",
          }}
        />
        {/* soft inner glow */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 50% 40% at 40% 20%, rgba(180,210,255,0.25) 0%, transparent 60%)",
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
        <span className="text-white text-sm font-light tracking-widest uppercase opacity-80">Destra</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Text content */}
      <div className="relative z-10 px-6 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.4 }}
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
      <div className="relative z-10 flex items-center gap-1.5 px-6 mt-5 mb-6">
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
      <div className="relative z-10 flex items-center justify-between px-5 pb-10 pt-2">

        {/* Prev / Next arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSlide(s => Math.max(0, s - 1))}
            className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => {
              if (slide < SLIDES.length - 1) setSlide(s => s + 1);
            }}
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-lg hover:bg-white/90 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Drag-to-enter button */}
        <div className="relative flex items-center gap-3">
          <span className="text-white/50 text-sm font-light">Entrar</span>

          {/* Overlay hint */}
          <motion.div
            style={{ opacity: overlayOpacity }}
            className="absolute inset-0 -inset-x-20 rounded-full bg-blue-400/20 pointer-events-none blur-xl"
          />

          <motion.button
            drag="y"
            dragConstraints={{ top: 0, bottom: 160 }}
            dragElastic={0.15}
            style={{ y: dragY, opacity: btnOpacity, scale: btnScale }}
            onDragEnd={handleDragEnd}
            onClick={goToLogin}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-xl cursor-grab active:cursor-grabbing"
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            >
              <ChevronDown className="w-6 h-6" strokeWidth={2} />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}