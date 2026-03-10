import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useClientPortal } from "@/components/client-portal/ClientPortalContext";
import { useQueryClient } from "@tanstack/react-query";
import { User, Building2, Mail, Phone, Briefcase, LogOut, Shield, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import ClientPortalGuard from "@/components/client-portal/ClientPortalGuard";

export default function ClientPortalAccount() {
  return (
    <ClientPortalGuard>
      <AccountContent />
    </ClientPortalGuard>
  );
}

function AccountContent() {
  const { user, clientContact, company, projects, selectedProject, setSelectedProject } = useClientPortal();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState(user?.full_name || "");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: displayName });
      qc.invalidateQueries({ queryKey: ["cpUser"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("ClientPortalLogin"));
  };

  const roleLabel = {
    client_user: "Visualizador",
    client_approver: "Aprovador",
    admin: "Administrador",
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Minha Conta</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie suas informações de acesso.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 text-xl font-bold flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{user?.full_name}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {roleLabel[user?.role] || "Cliente"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome de exibição</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail</label>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-500 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-slate-600 mt-1">O e-mail não pode ser alterado aqui.</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : null}
              {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Alterações"}
            </button>
          </form>
        </div>

        {/* Company Info */}
        {(clientContact || company) && (
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Empresa
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow icon={Building2} label="Empresa" value={company?.name} />
              {clientContact?.role && <InfoRow icon={Briefcase} label="Cargo" value={clientContact.role} />}
              {clientContact?.phone && <InfoRow icon={Phone} label="Telefone" value={clientContact.phone} />}
              <InfoRow icon={Mail} label="E-mail" value={user?.email} />
            </div>
          </div>
        )}

        {/* Active Projects */}
        {projects.length > 0 && (
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Projetos com Acesso ({projects.length})
            </h3>
            <div className="space-y-2">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProject(p.id); navigate(createPageUrl("ClientPortalDashboard")); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all
                    ${selectedProject?.id === p.id
                      ? "border-blue-500/40 bg-blue-500/10"
                      : "border-white/5 hover:border-white/10 hover:bg-white/3"
                    }`}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    {p.current_phase && <p className="text-xs text-slate-500 mt-0.5">{p.current_phase}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedProject?.id === p.id && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Ativo</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-sm font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div>
        <p className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</p>
        <p className="text-slate-200">{value}</p>
      </div>
    </div>
  );
}