import { useEffect } from "react";

/**
 * Altera a meta theme-color e o status bar style dinamicamente.
 * Para cores escuras usa "black-translucent" para que a safe area fique escura no iOS.
 * Restaura para branco ao desmontar.
 */
function isColorDark(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // luminância relativa
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function useThemeColor(color) {
  useEffect(() => {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');

    const dark = isColorDark(color);

    if (metaTheme) metaTheme.setAttribute("content", color);
    if (metaApple) metaApple.setAttribute("content", dark ? "black-translucent" : "default");

    // Também força o background do html/body para evitar flash branco nas safe areas
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;

    return () => {
      if (metaTheme) metaTheme.setAttribute("content", "#ffffff");
      if (metaApple) metaApple.setAttribute("content", "default");
      document.documentElement.style.backgroundColor = "#ffffff";
      document.body.style.backgroundColor = "#ffffff";
    };
  }, [color]);
}