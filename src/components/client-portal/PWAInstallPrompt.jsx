import React, { useState, useEffect, useRef } from "react";
import { X, Download, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState("");
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

    // Fallback: mostra popup se não receber beforeinstallprompt
    const fallbackTimer = setTimeout(() => {
      if (!promptShownRef.current && !isInstalled) {
        setShowPrompt(true);
        promptShownRef.current = true;
      }
    }, 1500);

    return () => {
      clearTimeout(fallbackTimer);
      if (handler) window.removeEventListener("beforeinstallprompt", handler);
      if (appInstalledHandler) window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    setInstalling(true);
    setMessage("");

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === "accepted") {
          setMessage("App instalado com sucesso!");
          setTimeout(() => {
            setIsInstalled(true);
            setShowPrompt(false);
          }, 1500);
        } else {
          setMessage("Instalação cancelada");
          setTimeout(() => setMessage(""), 2000);
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error("Erro ao instalar:", error);
        showManualInstructions();
      }
    } else {
      showManualInstructions();
    }
    
    setInstalling(false);
  };

  const showManualInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      setMessage("1. Toque em Compartilhar (caixa com seta) 2. Toque em 'Adicionar à Tela Inicial' 3. Toque em 'Adicionar'");
    } else if (isAndroid) {
      setMessage("1. Toque em ⋮ (três pontos) 2. Toque em 'Instalar app' 3. Toque em 'Instalar'");
    } else {
      setMessage("Seu navegador não suporta instalação de apps. Tente com Chrome, Edge ou Safari no celular.");
    }
    setTimeout(() => setMessage(""), 5000);
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

            {/* Mensagem de feedback */}
            {message && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">{message}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 w-full">
              <button
                onClick={handleDismiss}
                disabled={installing}
                className="flex-1 px-4 py-3 border-2 border-[#EAEAEA] rounded-xl text-[#131A20] font-semibold hover:bg-[#F8F9FB] active:bg-[#EAEAEA] transition-colors duration-200 cursor-pointer disabled:opacity-50"
                type="button"
              >
                Depois
              </button>
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#001A3D] to-[#456C8D] text-white rounded-xl font-semibold hover:shadow-lg active:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                type="button"
              >
                {installing ? (
                  <span className="inline-block animate-spin">⟳</span>
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {installing ? "Processando..." : "Instalar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}