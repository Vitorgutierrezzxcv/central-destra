import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { validateInviteToken } from "@/functions/validateInviteToken";
import { acceptInviteToken } from "@/functions/acceptInviteToken";
import { base44 } from "@/api/base44Client";
import { Building2, CheckCircle2, XCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientPortalActivate() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");

  const [status, setStatus] = useState("loading"); // loading | valid | invalid | expired | used | accepting | done
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    validateInviteToken({ token })
      .then(res => {
        if (res.data.valid) {
          setInviteData(res.data);
          setStatus("valid");
        } else {
          const reason = res.data.reason;
          if (reason === "expired") setStatus("expired");
          else if (reason === "already_used") setStatus("used");
          else setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleAccept = async () => {
    setStatus("accepting");
    // Aceitar o convite (marca UserProfile, ativa ClientContact)
    const res = await acceptInviteToken({ token });
    if (res.data?.success) {
      // Redirecionar para login — após login base44 redireciona para o portal
      base44.auth.redirectToLogin(createPageUrl("ClientPortalDashboard"));
    } else {
      setError(res.data?.error || "Erro ao ativar convite.");
      setStatus("valid");
    }
  };

  if (status === "loading" || status === "accepting") {
    return (
      <PortalShell>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-slate-400 text-sm">
            {status === "accepting" ? "Ativando sua conta..." : "Validando convite..."}
          </p>
        </div>
      </PortalShell>
    );
  }

  if (status === "expired") {
    return (
      <ErrorScreen
        icon={<AlertCircle className="w-8 h-8 text-amber-400" />}
        bg="bg-amber-500/10 border-amber-500/20"
        title="Convite expirado"
        message="Seu link expirou (validade de 7 dias). Peça à equipe Destra que reenvie o convite."
      />
    );
  }

  if (status === "used") {
    return (
      <ErrorScreen
        icon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
        bg="bg-emerald-500/10 border-emerald-500/20"
        title="Conta já ativada"
        message="Este convite já foi utilizado. Acesse o portal com seu e-mail e senha normalmente."
        action={{ label: "Ir para o Login", onClick: () => navigate(createPageUrl("ClientPortalLogin"), { replace: true }) }}
      />
    );
  }

  if (status === "invalid") {
    return (
      <ErrorScreen
        icon={<XCircle className="w-8 h-8 text-rose-400" />}
        bg="bg-rose-500/10 border-rose-500/20"
        title="Link inválido"
        message="Este link não é válido ou foi cancelado. Entre em contato com a equipe Destra."
      />
    );
  }

  // status === "valid"
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      {/* Left branding */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[#0D1221] border-r border-white/5 p-14 justify-center">
        <div className="max-w-sm">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-widest">DESTRA</p>
              <p className="text-[10px] text-slate-500 tracking-wider">PORTAL DO CLIENTE</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Bem-vindo ao seu portal 🎉</h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            Ao confirmar o acesso, você será redirecionado para definir sua senha e entrar no portal.
          </p>
          {(inviteData?.company || inviteData?.project) && (
            <div className="space-y-3">
              {inviteData.company && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Empresa</p>
                    <p className="text-sm font-semibold text-white">{inviteData.company.name}</p>
                  </div>
                </div>
              )}
              {inviteData.project && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Projeto</p>
                    <p className="text-sm font-semibold text-white">{inviteData.project.name}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right — CTA */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-widest">DESTRA</p>
              <p className="text-[10px] text-slate-500 tracking-wider">PORTAL DO CLIENTE</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {inviteData?.contact ? `Olá, ${inviteData.contact.name.split(" ")[0]}!` : "Seu convite está pronto"}
            </h1>
            <p className="text-slate-400 text-sm">Confirme o acesso para ativar sua conta no Portal Destra.</p>
          </div>

          {/* Info box */}
          <div className="bg-[#0D1221] border border-white/8 rounded-2xl p-5 mb-6 space-y-3">
            {inviteData?.contact?.email && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">E-mail</p>
                <p className="text-sm text-white font-medium">{inviteData.contact.email}</p>
              </div>
            )}
            {inviteData?.company && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Empresa</p>
                <p className="text-sm text-white font-medium">{inviteData.company.name}</p>
              </div>
            )}
            {inviteData?.project && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Projeto</p>
                <p className="text-sm text-white font-medium">{inviteData.project.name}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <p className="text-rose-300 text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handleAccept}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base gap-2 shadow-lg shadow-blue-900/30"
          >
            Confirmar e Acessar o Portal
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-center text-xs text-slate-600 mt-6">
            Você será redirecionado para definir sua senha e entrar no portal.
          </p>
        </div>
      </div>
    </div>
  );
}

function PortalShell({ children }) {
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
      {children}
    </div>
  );
}

function ErrorScreen({ icon, bg, title, message, action }) {
  return (
    <PortalShell>
      <div className="max-w-md w-full text-center p-6">
        <div className={`w-16 h-16 rounded-2xl ${bg} border flex items-center justify-center mx-auto mb-6`}>
          {icon}
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">{message}</p>
        {action && (
          <Button onClick={action.onClick} className="bg-blue-600 hover:bg-blue-500 text-white px-8">
            {action.label}
          </Button>
        )}
      </div>
    </PortalShell>
  );
}