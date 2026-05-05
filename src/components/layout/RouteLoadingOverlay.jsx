import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const LOGO = "https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/89686ac9e_destra_logo_color_131A201.svg";

export default function RouteLoadingOverlay() {
  const location = useLocation();
  const [phase, setPhase] = useState("hidden"); // hidden | in | out
  const prevPath = useRef(location.pathname);
  const timer = useRef(null);

  useEffect(() => {
    // Intercepta cliques em links antes da navegação — overlay aparece ANTES da nova página
    const handleClick = (e) => {
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#")) return;
      clearTimeout(timer.current);
      setPhase("in");
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;
    // Rota mudou = nova página montou — esconde
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPhase("out");
      timer.current = setTimeout(() => setPhase("hidden"), 300);
    }, 400);
  }, [location.pathname]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (phase === "hidden") return null;

  return null;
}