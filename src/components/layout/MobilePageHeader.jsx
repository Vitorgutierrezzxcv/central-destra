import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function MobilePageHeader({ title, subtitle, backUrl, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else if (backUrl) navigate(backUrl);
    else navigate(-1);
  };

  return (
    <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 flex items-center gap-3">
      <button
        onClick={handleBack}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors flex-shrink-0"
        aria-label="Voltar"
      >
        <ArrowLeft className="w-5 h-5 text-slate-700" />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>
    </header>
  );
}