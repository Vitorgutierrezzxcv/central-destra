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
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-end">
      <div className="w-full bg-white rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Instale nosso app</h3>
              <p className="text-sm text-slate-500">Acesso rápido e atualizações automáticas</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-green-600 font-bold">✓</span>
            </div>
            <span className="text-slate-700">Abre direto na tela inicial do seu telefone</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-green-600 font-bold">✓</span>
            </div>
            <span className="text-slate-700">Funciona offline com dados já carregados</span>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs text-green-600 font-bold">✓</span>
            </div>
            <span className="text-slate-700">Atualiza automaticamente sem precisar reinstalar</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Agora não
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Instalar app
          </button>
        </div>
      </div>
    </div>
  );
}