import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Building2, Mail, Phone, MapPin, Shield, Camera, Save, Loader2, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-white font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ClientPortalAccount() {
  const { user, userLoading, company, userProfile, contactId } = useClientPortal();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ phone: "", address: "" });

  const { data: contact } = useQuery({
    queryKey: ["client_contact", contactId],
    queryFn: () => base44.entities.ClientContact.filter({ id: contactId }).then(d => d?.[0] || null),
    enabled: !!contactId
  });

  useEffect(() => {
    if (contact) {
      setForm({ phone: contact.phone || "", address: contact.address || "" });
    }
  }, [contact]);

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.ClientContact.update(contact.id, {
      phone: form.phone,
      address: form.address,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_contact"] });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = user?.full_name || user?.email || "Cliente";
  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Minha Conta</h1>
          <p className="text-slate-400 text-sm mt-1">Seus dados cadastrais e configurações de acesso.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <Badge className="mt-1 bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                Portal do Cliente
              </Badge>
            </div>
          </div>

          {/* Read-only info */}
          <div className="space-y-1 mb-6">
            <InfoRow icon={Mail} label="E-mail (contato Destra para alterar)" value={user?.email} />
            {company && <InfoRow icon={Building2} label="Empresa" value={company.name} />}
            {contact?.position && <InfoRow icon={User} label="Cargo" value={contact.position} />}
          </div>

          {/* Editable fields */}
          <div className="border-t border-white/5 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Dados Editáveis</h3>
              {!editing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
                >
                  Editar
                </Button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Endereço / Localização</Label>
                  <Input
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Cidade, Estado"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <InfoRow icon={Phone} label="Telefone" value={contact?.phone} />
                <InfoRow icon={MapPin} label="Endereço" value={contact?.address} />
              </div>
            )}
          </div>

          {saved && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-emerald-300">Dados salvos com sucesso!</p>
            </div>
          )}
        </div>

        {/* Security */}
        <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-white">Segurança</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm text-white">Senha</p>
                  <p className="text-xs text-slate-500">Para alterar sua senha, entre em contato com a equipe Destra</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Info */}
        {company && (
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Dados da Empresa</h2>
            </div>
            <div className="space-y-1">
              <InfoRow icon={Building2} label="Razão Social" value={company.name} />
              {company.segment && <InfoRow icon={User} label="Segmento" value={company.segment} />}
              {company.email && <InfoRow icon={Mail} label="E-mail Comercial" value={company.email} />}
              {company.phone && <InfoRow icon={Phone} label="Telefone Comercial" value={company.phone} />}
              {company.address && <InfoRow icon={MapPin} label="Endereço" value={company.address} />}
            </div>
            <p className="text-xs text-slate-600 mt-4 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Para alterar dados da empresa, entre em contato com a equipe Destra.
            </p>
          </div>
        )}

        {/* Logout */}
        <div className="pb-8">
          <button
            onClick={() => base44.auth.logout()}
            className="w-full py-3 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/5 transition-colors text-sm font-medium"
          >
            Sair do Portal
          </button>
        </div>
      </div>
    </div>
  );
}