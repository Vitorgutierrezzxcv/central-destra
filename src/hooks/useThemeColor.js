import { useEffect } from "react";

/**
 * Altera a meta theme-color dinamicamente (cor da safe area no iPhone).
 * Restaura para branco ao desmontar o componente.
 */
export function useThemeColor(color) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", color);
    }
    return () => {
      if (meta) meta.setAttribute("content", "#ffffff");
    };
  }, [color]);
}