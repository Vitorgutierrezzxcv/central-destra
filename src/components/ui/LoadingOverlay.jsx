import React from "react";
import { AnimatePresence, motion } from "framer-motion";

const LOGO = "https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/89686ac9e_destra_logo_color_131A201.svg";

const cssKeyframes = `
@keyframes destraFlip {
  0%   { transform: perspective(400px) rotateY(0deg); }
  50%  { transform: perspective(400px) rotateY(180deg); }
  100% { transform: perspective(400px) rotateY(360deg); }
}
`;

function SpinningLogo({ size = 80, filter }) {
  return (
    <>
      <style>{cssKeyframes}</style>
      <img
        src={LOGO}
        alt="Destra"
        style={{
          width: size,
          height: size,
          animation: "destraFlip 1.6s ease-in-out infinite",
          willChange: "transform",
          filter: filter || "none",
          display: "block",
        }}
      />
    </>
  );
}

/**
 * FullPageLoader — tela cheia sólida com logo girando em 3D
 */
export function FullPageLoader({ theme = "light" }) {
  const isLight = theme === "light";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isLight ? "#ffffff" : "#0B1628",
      }}
    >
      <SpinningLogo size={80} filter={isLight ? "none" : "brightness(0) invert(1)"} />
    </div>
  );
}

/**
 * LoadingOverlay — overlay com blur sobre o conteúdo existente (para transições)
 */
export default function LoadingOverlay({ visible = true, theme = "light" }) {
  const isLight = theme === "light";
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            backgroundColor: isLight ? "rgba(255,255,255,0.75)" : "rgba(11,22,40,0.80)",
          }}
        >
          <SpinningLogo size={80} filter={isLight ? "none" : "brightness(0) invert(1)"} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}