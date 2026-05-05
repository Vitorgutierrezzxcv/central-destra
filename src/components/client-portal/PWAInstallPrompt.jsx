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
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-950 to-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300 border border-white/10">
        {/* Conteúdo */}
        <div className="p-7">
          {/* Icon + Título */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-md">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-extralight text-white tracking-tight">Instalar app</h2>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/40 hover:text-white/70 p-1 transition-colors flex-shrink-0"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensagem de feedback */}
          {message && (
            <div className="mb-5 p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-white/70 leading-relaxed font-light">{message}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              disabled={installing}
              className="flex-1 px-4 py-3 bg-white/10 text-white rounded-2xl text-sm font-light hover:bg-white/20 active:bg-white/15 transition-all duration-200 disabled:opacity-50 backdrop-blur-sm"
              type="button"
            >
              Depois
            </button>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 px-4 py-3 bg-white text-slate-950 rounded-2xl text-sm font-light hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              type="button"
            >
              {installing ? (
                <span className="inline-block animate-spin text-sm">↻</span>
              ) : (
                <Download className="w-4 h-4" />
              )}
              {installing ? "Instalando..." : "Instalar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}