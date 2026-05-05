import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

/**
 * Mostra o LoadingOverlay com blur durante transições de rota.
 * Coloque este componente dentro do Router, fora das rotas.
 */
export default function RouteLoadingOverlay({ theme = "light" }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(location.pathname);
  const timer = useRef(null);

  useEffect(() => {
    // Só dispara se a rota mudou de fato
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    // Mostra o overlay
    setVisible(true);

    // Esconde após a página carregar (tempo suficiente para o React renderizar)
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setVisible(false);
    }, 800);

    return () => clearTimeout(timer.current);
  }, [location.pathname]);

  return <LoadingOverlay visible={visible} theme={theme} />;
}