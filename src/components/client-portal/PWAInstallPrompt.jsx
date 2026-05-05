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
    <div className="fixed inset-0 bg-black/30 z-[9999] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        {/* Header limpo */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Instalar app</h2>
              <p className="text-xs text-slate-500">Acesso rápido e offline</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors flex-shrink-0"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5">
          {/* Benefícios minimalistas */}
          <div className="space-y-2 mb-6">
            {[
              { icon: "⚡", text: "Acesso instantâneo na tela inicial" },
              { icon: "📱", text: "Funciona sem internet" },
              { icon: "✨", text: "Sem necessidade de atualizar" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs">
                <span className="text-sm">{item.icon}</span>
                <span className="text-slate-700">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Mensagem de feedback */}
          {message && (
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-700 leading-relaxed">{message}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2.5">
            <button
              onClick={handleDismiss}
              disabled={installing}
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors duration-200 disabled:opacity-50"
              type="button"
            >
              Depois
            </button>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 px-3 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 active:bg-slate-950 transition-colors duration-200 flex items-center justify-center gap-1.5 disabled:opacity-60"
              type="button"
            >
              {installing ? (
                <span className="inline-block animate-spin text-xs">⟳</span>
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {installing ? "Instalando..." : "Instalar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}