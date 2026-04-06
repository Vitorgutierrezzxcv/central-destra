import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Building2, Mail, Phone, MapPin, Shield, Save, Loader2, CheckCircle2, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import { clearSession } from "@/lib/clientPortalSession";
import { useNavigate } from "react-router-dom";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-800 font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ClientPortalAccount() {
  const navigate = useNavigate();
  const { user, userLoading, company, contactId } = useClientPortal();
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

  const handleLogout = () => {
    clearSession();
    navigate("/ClientPortalLogin", { replace: true });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const displayName = user?.full_name || user?.name || user?.email || "Cliente";
  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 pt-40 pb-20">
         <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-1">
           Minha Conta
         </p>
        <h1 className="text-7xl md:text-6xl leading-[0.95] font-extralight text-slate-900 tracking-tight mb-1">
          Seus<br /><span className="text-8xl md:text-7xl font-extralight">Dados</span>
        </h1>
        <p className="text-xl md:text-[0.9rem] text-slate-400 font-light leading-relaxed mb-6">
          Gerenciamento de perfil e segurança.
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5 space-y-4 pb-20">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <Badge className="mt-1 bg-slate-900 text-white border-slate-800 text-xs">
                Portal do Cliente
              </Badge>
            </div>
          </div>

          {/* Read-only info */}
          <div className="space-y-0 mb-6">
            <InfoRow icon={Mail} label="E-mail (contato Destra para alterar)" value={user?.email} />
            {company && <InfoRow icon={Building2} label="Empresa" value={company.name} />}
            {contact?.role && <InfoRow icon={User} label="Cargo" value={contact.role} />}
          </div>

          {/* Editable fields */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Dados Editáveis</h3>
              {!editing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="border-slate-200 text-slate-600 hover:text-slate-900"
                >
                  Editar
                </Button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Endereço / Localização</Label>
                  <Input
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Cidade, Estado"
                    className="border-slate-200"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
                  <Button
                    size="sm"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                <InfoRow icon={Phone} label="Telefone" value={contact?.phone} />
                <InfoRow icon={MapPin} label="Endereço" value={contact?.address} />
              </div>
            )}
          </div>

          {saved && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-700">Dados salvos com sucesso!</p>
            </div>
          )}
        </div>

        {/* Security */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-slate-900" />
            <h2 className="font-semibold text-slate-900">Segurança</h2>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-sm text-slate-700">Senha</p>
                <p className="text-xs text-slate-400">Para alterar sua senha, entre em contato com a equipe Destra</p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Info */}
        {company && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-slate-900" />
              <h2 className="font-semibold text-slate-900">Dados da Empresa</h2>
            </div>
            <div className="space-y-0">
              <InfoRow icon={Building2} label="Razão Social" value={company.name} />
              {company.segment && <InfoRow icon={User} label="Segmento" value={company.segment} />}
              {company.email && <InfoRow icon={Mail} label="E-mail Comercial" value={company.email} />}
              {company.phone && <InfoRow icon={Phone} label="Telefone Comercial" value={company.phone} />}
              {company.address && <InfoRow icon={MapPin} label="Endereço" value={company.address} />}
            </div>
            <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Para alterar dados da empresa, entre em contato com a equipe Destra.
            </p>
          </div>
        )}

        {/* Logout */}
        <div className="pb-8">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}