import React from "react";
import { AnimatePresence, motion } from "framer-motion";

const LOGO = "https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/89686ac9e_destra_logo_color_131A201.svg";

const spinStyle = {
  animation: "destraFlip 1.4s ease-in-out infinite",
  transformStyle: "preserve-3d",
  willChange: "transform",
};

const cssKeyframes = `
@keyframes destraFlip {
  0%   { transform: rotateY(0deg); }
  50%  { transform: rotateY(180deg); }
  100% { transform: rotateY(360deg); }
}
`;

function InjectCSS() {
  return <style>{cssKeyframes}</style>;
}

/**
 * FullPageLoader — tela cheia sólida com logo girando em 3D
 */
export function FullPageLoader({ theme = "light" }) {
  const isLight = theme === "light";
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: isLight ? "#ffffff" : "#0B1628" }}
    >
      <InjectCSS />
      <img
        src={LOGO}
        alt="Destra"
        width={52}
        height={52}
        style={{
          ...spinStyle,
          filter: isLight ? "none" : "brightness(0) invert(1)",
        }}
      />
    </div>
  );
}

/**
 * LoadingOverlay — overlay com blur sobre o conteúdo existente
 */
export default function LoadingOverlay({ visible = true, theme = "light" }) {
  const isLight = theme === "light";
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading-overlay"
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            backdropFilter: "blur(20px) saturate(1.3)",
            WebkitBackdropFilter: "blur(20px) saturate(1.3)",
            backgroundColor: isLight ? "rgba(255,255,255,0.7)" : "rgba(11,22,40,0.75)",
          }}
        >
          <InjectCSS />
          <img
            src={LOGO}
            alt="Destra"
            width={52}
            height={52}
            style={{
              ...spinStyle,
              filter: isLight ? "none" : "brightness(0) invert(1)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}