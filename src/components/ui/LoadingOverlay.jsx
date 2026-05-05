import React from "react";

const LOGO = "https://media.base44.com/images/public/68f8158f5a9adbc29cfb7e53/89686ac9e_destra_logo_color_131A201.svg";

const CSS = `
@keyframes destraFlip {
  0%   { transform: perspective(600px) rotateY(0deg); }
  50%  { transform: perspective(600px) rotateY(180deg); }
  100% { transform: perspective(600px) rotateY(360deg); }
}
@keyframes overlayPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.04); }
}
`;

function Bg() {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "radial-gradient(ellipse 80% 60% at 50% 0%, #dce9ff 0%, #f5f7ff 55%, #ffffff 100%)",
      zIndex: 0,
    }} />
  );
}

export function FullPageLoader({ theme = "light" }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      <style>{CSS}</style>
      <Bg />
      <img
        src={LOGO}
        alt="Destra"
        style={{
          position: "relative",
          zIndex: 1,
          width: 80,
          height: 80,
          animation: "destraFlip 1.4s ease-in-out infinite",
          willChange: "transform",
          display: "block",
        }}
      />
    </div>
  );
}

export default function LoadingOverlay({ visible = true, theme = "light" }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      <style>{CSS}</style>
      <Bg />
      <img
        src={LOGO}
        alt="Destra"
        style={{
          position: "relative",
          zIndex: 1,
          width: 80,
          height: 80,
          animation: "destraFlip 1.4s ease-in-out infinite",
          willChange: "transform",
          display: "block",
        }}
      />
    </div>
  );
}