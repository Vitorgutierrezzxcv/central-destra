import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOGO = "https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/89686ac9e_destra_logo_color_131A201.svg";

/**
 * LoadingOverlay — logo Destra girando em 3D sobre um fundo blur
 * @param {boolean} visible - controla exibição
 * @param {"light"|"dark"} theme - "light" para fundo branco, "dark" para fundo escuro (portal)
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
          <motion.img
            src={LOGO}
            alt="Destra"
            style={{
              width: 52,
              height: 52,
              transformStyle: "preserve-3d",
              willChange: "transform",
              filter: isLight ? "none" : "brightness(0) invert(1)",
            }}
            animate={{ rotateY: [0, 180, 360] }}
            transition={{
              duration: 1.6,
              ease: [0.4, 0, 0.6, 1],
              repeat: Infinity,
              repeatDelay: 0.05,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * FullPageLoader — tela cheia de carregamento inicial (sem blur, só fundo sólido)
 * Para usar em substituição de spinners de tela inteira no App.jsx e ClientPortalLayout
 */
export function FullPageLoader({ theme = "light" }) {
  const isLight = theme === "light";
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: isLight ? "#ffffff" : "#0B1628" }}
    >
      <motion.img
        src={LOGO}
        alt="Destra"
        style={{
          width: 52,
          height: 52,
          transformStyle: "preserve-3d",
          willChange: "transform",
          filter: isLight ? "none" : "brightness(0) invert(1)",
        }}
        animate={{ rotateY: [0, 180, 360] }}
        transition={{
          duration: 1.6,
          ease: [0.4, 0, 0.6, 1],
          repeat: Infinity,
          repeatDelay: 0.05,
        }}
      />
    </div>
  );
}