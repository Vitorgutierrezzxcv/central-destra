import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { validateInviteToken } from "@/functions/validateInviteToken";
import { acceptInviteToken } from "@/functions/acceptInviteToken";
import { base44 } from "@/api/base44Client";
import { Building2, CheckCircle2, XCircle, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientPortalActivate() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token");

  const [status, setStatus] = useState("loading"); // loading | valid | invalid | expired | used | activating | done | error
  const [inviteData, setInviteData] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleActivate = async () => {
    if (!password || password.length < 6) {
      setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }
    setErrorMsg("");
    setStatus("activating");

    // 1. Registrar o usuário na plataforma (base44 login nativo)
    await base44.auth.redirectToLogin(
      createPageUrl("ClientPortalActivateConfirm") + `?token=${token}`
    );
    // Nota: o usuário vai fazer login/signup nativo, e ao retornar ao portal, acceptInviteToken é chamado
  };

  // ---- Renderizações condicionais ----

  if (status === "loading" || status === "activating") {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <p className="text-slate-400 text-sm">
            {status === "activating" ? "Ativando sua conta..." : "Validando seu convite..."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return <InviteError
      icon={<AlertCircle className="w-8 h-8 text-amber-400" />}
      title="Convite expirado"
      message="Seu link de convite expirou (válido por 7 dias). Entre em contato com a equipe Destra para solicitar um novo convite."
      color="amber"
    />;
  }

  if (status === "used") {
    return <InviteError
      icon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
      title="Conta já ativada"
      message="Este link já foi utilizado. Sua conta já está ativa. Acesse o portal com seu e-mail e senha."
      color="emerald"
      showLogin
      navigate={navigate}
    />;
  }

  if (status === "invalid") {
    return <InviteError
      icon={<XCircle className="w-8 h-8 text-rose-400" />}
      title="Link inválido"
      message="Este link de convite não é válido ou foi cancelado. Entre em contato com a equipe Destra."
      color="rose"
    />;
  }

  if (status === "done") {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Conta ativada!</h1>
          <p className="text-slate-400 mb-8">Bem-vindo ao portal. Você já pode acessar seu projeto.</p>
          <Button
            onClick={() => navigate(createPageUrl("ClientPortalDashboard"), { replace: true })}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
          >
            Ir para o Portal
          </Button>
        </div>
      </div>
    );
  }

  // status === "valid" → form de definição de senha
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[#0D1221] border-r border-white/5 p-12 justify-center">
        <div className="max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-widest">DESTRA</p>
              <p className="text-[10px] text-slate-500 tracking-wider">PORTAL DO CLIENTE</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Bem-vindo ao seu portal 🎉</h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            Defina sua senha para ativar a conta e começar a acompanhar seu projeto em tempo real.
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
                    <p className="text-sm font-medium text-white">{inviteData.company.name}</p>
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
                    <p className="text-sm font-medium text-white">{inviteData.project.name}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — form */}
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

          {inviteData?.contact && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">Olá, {inviteData.contact.name.split(" ")[0]}! 👋</h1>
              <p className="text-slate-400 text-sm mt-1">Defina sua senha para ativar o acesso ao portal.</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <Label className="text-slate-300 text-sm">E-mail</Label>
              <Input
                value={inviteData?.contact?.email || ""}
                disabled
                className="mt-1.5 bg-white/5 border-white/10 text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Criar senha</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Confirmar senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-slate-600"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="text-rose-300 text-sm">{errorMsg}</p>
              </div>
            )}

            <Button
              onClick={handleActivate}
              disabled={!password || !confirmPassword}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base mt-2 disabled:opacity-40"
            >
              Ativar minha conta
            </Button>
          </div>

          <p className="text-center text-xs text-slate-600 mt-8">
            Ao ativar sua conta, você terá acesso exclusivo ao portal da Destra.
          </p>
        </div>
      </div>
    </div>
  );
}

function InviteError({ icon, title, message, color, showLogin, navigate }) {
  const colorMap = {
    amber: "bg-amber-500/10 border-amber-500/20",
    rose: "bg-rose-500/10 border-rose-500/20",
    emerald: "bg-emerald-500/10 border-emerald-500/20"
  };
  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className={`w-16 h-16 rounded-2xl ${colorMap[color]} border flex items-center justify-center mx-auto mb-6`}>
          {icon}
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">{message}</p>
        {showLogin && (
          <Button
            onClick={() => navigate(createPageUrl("ClientPortalLogin"), { replace: true })}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8"
          >
            Ir para o Login
          </Button>
        )}
      </div>
    </div>
  );
}