import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientPortalLogin() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Se já está logado, redireciona
  useEffect(() => {
    base44.auth.me()
      .then(async user => {
        if (user) {
          const isClient = user.role === "client_user" || user.role === "client_approver";
          if (isClient) {
            // Verificar quantos projetos tem para decidir para onde ir
            try {
              const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
              const profile = profiles?.[0];
              if (profile?.linked_company_id) {
                const projects = await base44.entities.Project.filter({
                  company_id: profile.linked_company_id,
                  client_portal_enabled: true
                });
                if (projects.length === 1) {
                  navigate(`${createPageUrl("ClientPortalDashboard")}?project_id=${projects[0].id}`, { replace: true });
                } else {
                  navigate(createPageUrl("ClientPortalProjects"), { replace: true });
                }
              } else {
                navigate(createPageUrl("ClientPortalDashboard"), { replace: true });
              }
            } catch {
              navigate(createPageUrl("ClientPortalDashboard"), { replace: true });
            }
          } else {
            navigate(createPageUrl("Dashboard"), { replace: true });
          }
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogin = () => {
    // Base44 gerencia autenticação — redireciona para login nativo com next para o portal
    base44.auth.redirectToLogin(createPageUrl("ClientPortalDashboard"));
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[#0D1221] border-r border-white/5 p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/6 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-800/6 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-widest">DESTRA</p>
            <p className="text-xs text-slate-500 tracking-wider">PORTAL DO CLIENTE</p>
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Acompanhe seu projeto<br />
            <span className="text-blue-400">em tempo real.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Acesse entregas, aprovações, calendário e muito mais com total transparência.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Entregas", desc: "Revise e aprove" },
              { label: "Progresso", desc: "Acompanhe tudo" },
              { label: "Calendário", desc: "Reuniões e marcos" },
              { label: "Arquivos", desc: "Documentos do projeto" }
            ].map((item, i) => (
              <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-4">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
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

          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo</h1>
            <p className="text-slate-400 text-sm">Acesse o portal exclusivo do seu projeto.</p>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base gap-3 transition-all shadow-lg shadow-blue-900/40"
          >
            Entrar com sua conta
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="mt-10 p-4 bg-white/3 border border-white/8 rounded-2xl">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                O acesso a este portal é controlado pela equipe Destra. Caso ainda não tenha recebido seu convite, entre em contato com o seu gestor de conta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}