import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function ClientPortalFirstAccess() {
  const [step, setStep] = useState("form"); // form | success
  const [form, setForm] = useState({ name: "", email: "" });
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email) { setError("Informe seu e-mail de acesso."); return; }
    setLoading(true);
    try {
      // Verify the contact exists
      const contacts = await base44.entities.ClientContact.filter({ email: form.email.toLowerCase().trim() });
      if (contacts.length === 0) {
        setError("E-mail não encontrado. Verifique ou entre em contato com a equipe Destra.");
        setLoading(false);
        return;
      }
      const contact = contacts[0];
      if (contact.status === "inactive") {
        setError("Seu acesso está inativo. Entre em contato com a equipe Destra.");
        setLoading(false);
        return;
      }
      // Update contact as activated
      await base44.entities.ClientContact.update(contact.id, {
        activated_at: new Date().toISOString(),
        status: "active"
      });
      // Redirect to the platform login which will handle password setup for first-access
      base44.auth.redirectToLogin(createPageUrl("ClientPortalDashboard"));
    } catch (err) {
      setError("Erro ao verificar acesso. Tente novamente.");
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4">
        <div className="bg-[#0D1221] border border-white/8 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Conta Ativada!</h2>
          <p className="text-slate-400 text-sm mb-6">Seu acesso foi configurado. Agora você pode fazer login no portal.</p>
          <Link to={createPageUrl("ClientPortalLogin")} className="block w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors text-center">
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-600/30 mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Primeiro Acesso</h1>
          <p className="text-slate-400 text-sm mt-1">Ative sua conta no Portal da Destra</p>
        </div>

        <div className="bg-[#0D1221] border border-white/8 rounded-2xl p-8 shadow-2xl">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-300">
              Seu acesso foi criado pela equipe Destra. Informe seu e-mail cadastrado para ativar sua conta e definir sua senha.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Seu nome</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome completo"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail cadastrado *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@suaempresa.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Verificando..." : "Ativar Minha Conta"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6">
            Já tem acesso?{" "}
            <Link to={createPageUrl("ClientPortalLogin")} className="text-blue-400 hover:text-blue-300">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}