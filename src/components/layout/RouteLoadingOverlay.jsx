import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const LOGO = "https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/89686ac9e_destra_logo_color_131A201.svg";

const CSS = `
@keyframes destraFlip {
  0%   { transform: perspective(600px) rotateY(0deg); }
  50%  { transform: perspective(600px) rotateY(180deg); }
  100% { transform: perspective(600px) rotateY(360deg); }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
`;

export default function RouteLoadingOverlay({ theme = "light" }) {
  const location = useLocation();
  const [state, setState] = useState("hidden"); // hidden | showing | hiding
  const prevPath = useRef(location.pathname);
  const hideTimer = useRef(null);
  const isLight = theme === "light";

  useEffect(() => {
    // Intercepta cliques em links <a> e <Link> antes da navegação
    const handleClick = (e) => {
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#")) return;
      // É um link interno — mostra overlay imediatamente
      clearTimeout(hideTimer.current);
      setState("showing");
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    // Rota mudou — esconde o overlay após a página montar
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setState("hiding");
      hideTimer.current = setTimeout(() => setState("hidden"), 300);
    }, 500);
  }, [location.pathname]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  if (state === "hidden") return null;

  const animation = state === "showing"
    ? "fadeIn 0.15s ease forwards"
    : "fadeOut 0.3s ease forwards";

  return (
    <>
      <style>{CSS}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation,
          background: isLight
            ? "linear-gradient(135deg, rgba(248,249,252,0.96) 0%, rgba(232,240,255,0.96) 100%)"
            : "linear-gradient(135deg, rgba(11,22,40,0.96) 0%, rgba(20,35,65,0.96) 100%)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}
      >
        <img
          src={LOGO}
          alt="Destra"
          style={{
            width: 80,
            height: 80,
            animation: "destraFlip 1.4s ease-in-out infinite",
            willChange: "transform",
            filter: isLight ? "none" : "brightness(0) invert(1)",
            display: "block",
          }}
        />
      </div>
    </>
  );
}