import React, { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detecta se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Verifica se já viu o prompt
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Se não houver beforeinstallprompt, mostra mesmo assim
    const timer = setTimeout(() => {
      if (!showPrompt && !isInstalled && !dismissed) {
        setShowPrompt(true);
      }
    }, 2000);

    // Detecta instalação bem-sucedida
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, [showPrompt, isInstalled]);

  const handleInstall = async () => {
    try {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setIsInstalled(true);
          localStorage.setItem("pwa-prompt-dismissed", "true");
        }
        setShowPrompt(false);
        setDeferredPrompt(null);
      } else {
        // Se não houver beforeinstallprompt (desktop/teste), apenas fecha
        handleDismiss();
      }
    } catch (error) {
      console.error("Erro ao instalar:", error);
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header Gradient */}
        <div className="h-24 bg-gradient-to-r from-[#001A3D] to-[#456C8D] flex items-end p-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="w-7 h-7 text-[#001A3D]" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-[#001A3D] mb-2">Instale nosso app</h3>
          <p className="text-sm text-[#456C8D] mb-6">Acesso rápido e atualizações automáticas garantidas</p>

          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-5 h-5 bg-[#6FA6FF]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-[#6FA6FF] font-bold">✓</span>
              </div>
              <span className="text-[#131A20]">Abre direto na tela inicial do seu telefone</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-5 h-5 bg-[#6FA6FF]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-[#6FA6FF] font-bold">✓</span>
              </div>
              <span className="text-[#131A20]">Funciona offline com dados já carregados</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-5 h-5 bg-[#6FA6FF]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-[#6FA6FF] font-bold">✓</span>
              </div>
              <span className="text-[#131A20]">Atualiza automaticamente sem precisar reinstalar</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 border-2 border-[#EAEAEA] rounded-xl text-[#131A20] font-semibold hover:bg-[#F8F9FB] transition-all duration-200"
            >
              Agora não
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#001A3D] to-[#456C8D] text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Instalar
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-[#456C8D] hover:text-[#001A3D] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}