import React, { useState, useEffect, useRef } from "react";
import { X, Download, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const promptShownRef = useRef(false);

  useEffect(() => {
    // Detecta se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    let handler, appInstalledHandler;

    const setupListeners = () => {
      handler = (e) => {
        console.log("beforeinstallprompt event received");
        e.preventDefault();
        setDeferredPrompt(e);
        if (!promptShownRef.current) {
          setShowPrompt(true);
          promptShownRef.current = true;
        }
      };

      appInstalledHandler = () => {
        console.log("App instalado");
        setIsInstalled(true);
        setShowPrompt(false);
        setDeferredPrompt(null);
      };

      window.addEventListener("beforeinstallprompt", handler);
      window.addEventListener("appinstalled", appInstalledHandler);
    };

    setupListeners();

    // Se não receber beforeinstallprompt em 2 segundos, mostra mesmo assim
    const fallbackTimer = setTimeout(() => {
      if (!promptShownRef.current && !isInstalled) {
        console.log("Mostrando popup sem beforeinstallprompt");
        setShowPrompt(true);
        promptShownRef.current = true;
      }
    }, 2000);

    return () => {
      clearTimeout(fallbackTimer);
      if (handler) window.removeEventListener("beforeinstallprompt", handler);
      if (appInstalledHandler) window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.warn("Prompt não está disponível");
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log("Instalação resultado:", outcome);
      
      if (outcome === "accepted") {
        console.log("Usuário aceitou a instalação");
        setIsInstalled(true);
      }
      
      setShowPrompt(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Erro ao instalar:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Não renderiza se instalado ou prompt não deve ser mostrado
  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        <div className="relative">
          {/* Header com gradiente */}
          <div className="h-32 bg-gradient-to-br from-[#001A3D] via-[#456C8D] to-[#6FA6FF] flex items-end justify-between p-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -translate-y-2">
              <Smartphone className="w-8 h-8 text-[#001A3D]" />
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-[#001A3D] mb-1">Instale nosso app</h2>
            <p className="text-sm text-[#456C8D] mb-6">Acesso rápido, offline e atualizações automáticas</p>

            {/* Benefícios */}
            <div className="space-y-3 mb-8">
              {[
                "Abre direto na tela inicial do seu celular",
                "Funciona offline com seus dados",
                "Atualiza automaticamente"
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[#6FA6FF] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-white font-bold">✓</span>
                  </div>
                  <span className="text-sm text-[#131A20]">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Botões */}
            <div className="flex gap-3 w-full">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 border-2 border-[#EAEAEA] rounded-xl text-[#131A20] font-semibold hover:bg-[#F8F9FB] active:bg-[#EAEAEA] transition-colors duration-200 cursor-pointer"
                type="button"
              >
                Depois
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#001A3D] to-[#456C8D] text-white rounded-xl font-semibold hover:shadow-lg active:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                type="button"
              >
                <Download className="w-4 h-4" />
                Instalar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}