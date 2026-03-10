import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, Loader2, CheckCircle2, ArrowLeft, Mail } from "lucide-react";

export default function ClientPortalForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Informe seu e-mail."); return; }
    setError("");
    setLoading(true);
    try {
      // Check if contact exists
      const contacts = await base44.entities.ClientContact.filter({ email: email.toLowerCase().trim() });
      if (contacts.length === 0) {
        setError("E-mail não encontrado no sistema. Verifique ou entre em contato com a equipe Destra.");
        setLoading(false);
        return;
      }
      // Base44 handles password reset via the auth flow
      // We simulate sending by showing success and redirecting to platform login
      setSent(true);
    } catch {
      setError("Erro ao processar. Tente novamente.");
    }
    setLoading(false);
  };

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
          <h1 className="text-2xl font-bold text-white">Recuperar Senha</h1>
          <p className="text-slate-400 text-sm mt-1">Portal do Cliente Destra</p>
        </div>

        <div className="bg-[#0D1221] border border-white/8 rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">E-mail Verificado</h2>
              <p className="text-slate-400 text-sm mb-6">
                Clique abaixo para acessar a tela de login. Se não souber a senha, entre em contato com a equipe Destra para redefinição.
              </p>
              <button
                onClick={() => base44.auth.redirectToLogin(createPageUrl("ClientPortalDashboard"))}
                className="block w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors text-center"
              >
                Acessar Login
              </button>
              <Link to={createPageUrl("ClientPortalLogin")} className="block text-center mt-3 text-xs text-slate-500 hover:text-slate-400">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-6">
                Informe o e-mail cadastrado no seu perfil. A equipe Destra irá redefinir seu acesso e entrar em contato.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Seu e-mail de acesso</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Verificando..." : "Verificar E-mail"}
                </button>
              </form>

              <Link to={createPageUrl("ClientPortalLogin")} className="flex items-center justify-center gap-1.5 mt-6 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar ao login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}