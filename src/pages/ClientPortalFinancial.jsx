import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Receipt, FileText, Download, Copy, Check, ChevronRight,
  Clock, CheckCircle2, AlertCircle, XCircle, Loader2, ExternalLink,
  CreditCard, Landmark, QrCode
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const INVOICE_STATUS = {
  pending:   { label: "Pendente",   color: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-100", icon: Clock },
  paid:      { label: "Pago",       color: "text-emerald-600",bg: "bg-emerald-50", border: "border-emerald-100",icon: CheckCircle2 },
  overdue:   { label: "Vencida",    color: "text-rose-600",   bg: "bg-rose-50",    border: "border-rose-100",   icon: AlertCircle },
  cancelled: { label: "Cancelada",  color: "text-slate-400",  bg: "bg-slate-50",   border: "border-slate-100",  icon: XCircle },
};

const CONTRACT_STATUS = {
  draft:     { label: "Rascunho",   color: "text-slate-400",  bg: "bg-slate-50"  },
  sent:      { label: "Enviado",    color: "text-blue-600",   bg: "bg-blue-50"   },
  signed:    { label: "Assinado",   color: "text-emerald-600",bg: "bg-emerald-50"},
  active:    { label: "Ativo",      color: "text-emerald-600",bg: "bg-emerald-50"},
  completed: { label: "Concluído",  color: "text-slate-500",  bg: "bg-slate-50"  },
  cancelled: { label: "Cancelado",  color: "text-rose-500",   bg: "bg-rose-50"   },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-200 transition-colors text-xs text-slate-600 font-medium"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export default function ClientPortalFinancial() {
  const { userLoading, company, companyId, projects, canAccessProject } = useClientPortal();
  const [tab, setTab] = useState("invoices");
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");

  const activeProject = useMemo(() => {
    if (selectedProjectId && canAccessProject(selectedProjectId)) {
      return projects.find(p => p.id === selectedProjectId) || null;
    }
    return projects.find(p => p.status === "active") || projects[0] || null;
  }, [projects, selectedProjectId]);

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["client_invoices", companyId],
    queryFn: () => base44.entities.ClientInvoice.filter({ company_id: companyId, visible_to_client: true }),
    enabled: !!companyId,
    select: d => [...d].sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
  });

  const { data: contracts = [], isLoading: contLoading } = useQuery({
    queryKey: ["client_contracts", companyId],
    queryFn: () => base44.entities.ClientContract.filter({ company_id: companyId, visible_to_client: true }),
    enabled: !!companyId,
    select: d => [...d].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
  });

  const totalPaid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + (i.amount || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + (i.amount || 0), 0);

  const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto px-5 md:px-12 pt-24 md:pt-28 pb-36 space-y-4">

        {/* ── HERO ── */}
        <div className="pb-4">
          <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-1">
            {company?.name || "Portal do Cliente"}
          </p>
          <h1 className="text-[4.5rem] leading-[0.95] font-extralight text-slate-900 tracking-tight mb-3">
            Financeiro
          </h1>
          <p className="text-[0.9rem] text-slate-400 font-light leading-relaxed">
            Faturas, pagamentos e contratos do projeto.
          </p>
        </div>

        {/* ── RESUMO FINANCEIRO ── */}
        <div className="grid grid-cols-3 gap-2 -mt-8 md:-mt-10">
          <div className="border border-slate-100 rounded-2xl p-4">
            <span className="text-xl font-extralight text-emerald-600 leading-none block truncate">
              {fmt(totalPaid).replace("R$", "").trim()}
            </span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-medium mt-2 block">Pago</span>
          </div>
          <div className="bg-[#0d1117] rounded-2xl p-4">
            <span className="text-xl font-extralight text-white leading-none block truncate">
              {fmt(totalPending).replace("R$", "").trim()}
            </span>
            <span className="text-[9px] text-white/30 uppercase tracking-widest font-medium mt-2 block">Pendente</span>
          </div>
          <div className="border border-rose-100 rounded-2xl p-4">
            <span className="text-xl font-extralight text-rose-500 leading-none block truncate">
              {fmt(totalOverdue).replace("R$", "").trim()}
            </span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-medium mt-2 block">Vencido</span>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-2 pt-2">
          {[
            { key: "invoices",  label: "Faturas",   icon: Receipt  },
            { key: "contracts", label: "Contratos", icon: FileText },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${tab === t.key
                  ? "bg-[#0d1117] text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.key === "invoices" && invoices.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tab === "invoices" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                  {invoices.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── FATURAS ── */}
        {tab === "invoices" && (
          <div className="space-y-2">
            {invLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
              </div>
            )}

            {!invLoading && invoices.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <Receipt className="w-8 h-8 text-slate-200 mb-4" />
                <p className="text-slate-400 font-light text-sm">Nenhuma fatura disponível.</p>
              </div>
            )}

            {invoices.map(inv => {
              const s = INVOICE_STATUS[inv.status] || INVOICE_STATUS.pending;
              const StatusIcon = s.icon;
              const isExpanded = expandedInvoice === inv.id;
              const isOverdue = inv.status === "pending" && inv.due_date && new Date(inv.due_date) < new Date();

              return (
                <div key={inv.id} className={`rounded-2xl border overflow-hidden transition-all ${
                  isOverdue ? "border-rose-100" : "border-slate-100"
                }`}>
                  {/* Header da fatura */}
                  <button
                    onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 active:bg-slate-50 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                      <StatusIcon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {inv.description || inv.invoice_number || "Fatura"}
                          </p>
                          <p className="text-xs text-slate-400 font-light mt-0.5">
                            {inv.invoice_number && <span className="mr-2">{inv.invoice_number}</span>}
                            {inv.installment_number && inv.total_installments && (
                              <span>Parcela {inv.installment_number}/{inv.total_installments} · </span>
                            )}
                            Venc. {format(new Date(inv.due_date), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-slate-900">{fmt(inv.amount || 0)}</p>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium border ${s.color} ${s.bg} ${s.border}`}>
                            {s.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-200 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </button>

                  {/* Detalhes expandidos */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-50 space-y-4">

                      {inv.status === "paid" && inv.payment_date && (
                        <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <p className="text-xs text-emerald-700 font-light">
                            Pago em {format(new Date(inv.payment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      )}

                      {/* Boleto */}
                      {(inv.boleto_url || inv.boleto_barcode) && inv.status !== "paid" && inv.status !== "cancelled" && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                            <Landmark className="w-3 h-3" /> Boleto
                          </p>
                          {inv.boleto_barcode && (
                            <div className="bg-slate-50 rounded-xl p-3 font-mono text-[10px] text-slate-600 break-all leading-relaxed">
                              {inv.boleto_barcode}
                            </div>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            {inv.boleto_barcode && <CopyButton text={inv.boleto_barcode} />}
                            {inv.boleto_url && (
                              <a href={inv.boleto_url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1117] text-white text-xs font-medium hover:opacity-90 transition-opacity">
                                <Download className="w-3 h-3" />
                                Baixar boleto
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* PIX */}
                      {(inv.pix_key || inv.pix_qrcode) && inv.status !== "paid" && inv.status !== "cancelled" && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                            <QrCode className="w-3 h-3" /> PIX
                          </p>
                          {inv.pix_qrcode && inv.pix_qrcode.startsWith("data:") && (
                            <div className="flex justify-center py-2">
                              <img src={inv.pix_qrcode} alt="QR Code PIX" className="w-36 h-36 rounded-xl" />
                            </div>
                          )}
                          {inv.pix_key && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono truncate">
                                {inv.pix_key}
                              </div>
                              <CopyButton text={inv.pix_key} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comprovante */}
                      {inv.receipt_url && (
                        <a href={inv.receipt_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                          Ver comprovante de pagamento
                        </a>
                      )}

                      {inv.notes && (
                        <p className="text-xs text-slate-400 font-light border-t border-slate-50 pt-3">
                          {inv.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CONTRATOS ── */}
        {tab === "contracts" && (
          <div className="space-y-2">
            {contLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
              </div>
            )}

            {!contLoading && contracts.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <FileText className="w-8 h-8 text-slate-200 mb-4" />
                <p className="text-slate-400 font-light text-sm">Nenhum contrato disponível.</p>
              </div>
            )}

            {contracts.map(c => {
              const s = CONTRACT_STATUS[c.status] || CONTRACT_STATUS.draft;
              return (
                <div key={c.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 leading-snug">{c.title}</p>
                        {c.contract_number && (
                          <p className="text-[10px] text-slate-400 font-light mt-0.5">{c.contract_number}</p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 text-[9px] px-2.5 py-1 rounded-full font-medium ${s.color} ${s.bg}`}>
                        {s.label}
                      </span>
                    </div>

                    {c.description && (
                      <p className="text-xs text-slate-400 font-light leading-relaxed mb-3">{c.description}</p>
                    )}

                    <div className="space-y-1.5 mb-4">
                      {c.contract_value && (
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Valor</p>
                          <p className="text-xs text-slate-700 font-medium">{fmt(c.contract_value)}</p>
                        </div>
                      )}
                      {c.start_date && (
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Início</p>
                          <p className="text-xs text-slate-600 font-light">{format(new Date(c.start_date), "dd/MM/yyyy")}</p>
                        </div>
                      )}
                      {c.end_date && (
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Término</p>
                          <p className="text-xs text-slate-600 font-light">{format(new Date(c.end_date), "dd/MM/yyyy")}</p>
                        </div>
                      )}
                      {c.client_signed_at && (
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Assinado em</p>
                          <p className="text-xs text-emerald-600 font-light">
                            {format(new Date(c.client_signed_at), "dd/MM/yyyy")}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-50">
                      {c.file_url && (
                        <a href={c.file_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0d1117] text-white text-xs font-medium hover:opacity-90 transition-opacity">
                          <Download className="w-3 h-3" />
                          {c.signed_file_url ? "Contrato original" : "Baixar contrato"}
                        </a>
                      )}
                      {c.signed_file_url && (
                        <a href={c.signed_file_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors border border-emerald-100">
                          <Download className="w-3 h-3" />
                          Contrato assinado
                        </a>
                      )}
                      {!c.file_url && !c.signed_file_url && (
                        <p className="text-[10px] text-slate-300 font-light py-1">Arquivo não disponível</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}