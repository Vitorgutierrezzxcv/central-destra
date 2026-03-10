import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import { useQueryClient } from "@tanstack/react-query";
import { User, Mail, Building2, Briefcase, Lock, LogOut, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClientPortalAccount() {
  const qc = useQueryClient();
  const { user, userProfile, company } = useClientPortal();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState(user?.full_name || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: displayName });
      qc.invalidateQueries({ queryKey: ["currentUser"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const accessLabel = user?.role === "client_approver" ? "Aprovador" : "Visualizador";
  const accessColor = user?.role === "client_approver"
    ? "bg-purple-500/15 text-purple-300 border-purple-500/20"
    : "bg-blue-500/15 text-blue-300 border-blue-500/20";

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Minha Conta</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie suas informações de perfil.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Avatar & Identity */}
        <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 text-2xl font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{user?.full_name}</p>
              <span className={`inline-block text-xs px-2.5 py-1 rounded-full border mt-1 ${accessColor}`}>
                {accessLabel}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block">Nome completo</Label>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            <div>
              <Label className="text-slate-400 text-xs mb-1.5 block">E-mail</Label>
              <div className="flex items-center gap-3 h-10 px-3 bg-white/3 border border-white/8 rounded-md">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400">{user?.email}</span>
              </div>
            </div>

            {company && (
              <div>
                <Label className="text-slate-400 text-xs mb-1.5 block">Empresa</Label>
                <div className="flex items-center gap-3 h-10 px-3 bg-white/3 border border-white/8 rounded-md">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-400">{company.name}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : saved
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  : <Save className="w-4 h-4" />}
              {saved ? "Salvo!" : "Salvar"}
            </Button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-1">Segurança</h2>
          <p className="text-slate-400 text-sm mb-4">Gerenciado pela equipe Destra. Para alterar sua senha, solicite ao seu gestor de conta.</p>
          <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl">
            <Lock className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">••••••••••••</span>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-[#0D1221] border border-rose-500/10 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-1">Sair da conta</h2>
          <p className="text-slate-400 text-sm mb-4">Você será desconectado do portal do cliente.</p>
          <Button
            variant="outline"
            onClick={() => base44.auth.logout()}
            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}