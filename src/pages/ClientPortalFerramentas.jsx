import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  CheckSquare, Stethoscope, Calculator, BarChart3,
  ChevronRight, TrendingUp, ShoppingCart, DollarSign, RefreshCw,
  Link2, Filter, Zap, FileSpreadsheet
} from "lucide-react";

const SECTIONS = [
  {
    id: "checklist",
    label: "Checklist",
    sub: "105 ações para escalar sua loja",
    icon: CheckSquare,
    page: "ClientPortalEcommerceChecklist",
    external: true,
  },
  {
    id: "diagnostico",
    label: "Diagnóstico",
    sub: "Descubra suas prioridades",
    icon: Stethoscope,
    page: "ClientPortalDiagnostico",
    external: true,
  },
  {
    id: "calculadoras",
    label: "Calculadoras",
    sub: "ROI, CAC, LTV, Precificação e mais",
    icon: Calculator,
    page: "ClientPortalCalculadoras",
    external: true,
  },
  {
    id: "kpis",
    label: "KPIs",
    sub: "Painel de métricas do seu negócio",
    icon: BarChart3,
    page: "ClientPortalKPIs",
    external: true,
  },
];

const ALAVANCAS_SUMMARY = [
  { label: "Tráfego",      icon: TrendingUp,   items: 29 },
  { label: "Conversão",    icon: ShoppingCart, items: 36 },
  { label: "Ticket Médio", icon: DollarSign,   items: 12 },
  { label: "Retenção",     icon: RefreshCw,    items: 28 },
];

const TOOLS_PREVIEW = [
  { icon: Calculator,      label: "Calculadora de Precificação" },
  { icon: TrendingUp,      label: "Calculadora de ROI" },
  { icon: DollarSign,      label: "Calculadora de CAC" },
  { icon: RefreshCw,       label: "Calculadora de LTV" },
  { icon: Link2,           label: "Construtor de UTM" },
  { icon: Filter,          label: "Planejador de Funil" },
  { icon: Zap,             label: "Planejador de Tráfego" },
  { icon: FileSpreadsheet, label: "Projeção de DRE" },
];

export default function ClientPortalFerramentas() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="w-full px-5 md:px-8 pt-28 md:pt-12 pb-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">Central do Cliente</p>
        <h1 className="text-7xl md:text-6xl font-extralight text-slate-900 tracking-tight leading-[1.1] mb-2">
          Ferramentas
        </h1>
        <p className="text-slate-400 font-light text-sm">
          Tudo que você precisa para crescer seu e-commerce
        </p>
      </div>

      {/* Main nav cards */}
      <div className="px-5 md:px-8 pb-6">
        <div className="space-y-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.id}
              to={createPageUrl(s.page)}
              className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-5 py-5 hover:border-slate-200 hover:shadow-sm transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-slate-900">{s.label}</p>
                <p className="text-xs text-slate-400 font-light mt-0.5">{s.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Quick peek — checklist alavancas */}
      <div className="px-5 md:px-8 pb-6">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-4">Checklist por alavanca</p>
        <div className="grid grid-cols-2 gap-3">
          {ALAVANCAS_SUMMARY.map(a => (
            <Link
              key={a.label}
              to={createPageUrl("ClientPortalEcommerceChecklist")}
              className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-4 hover:border-slate-200 transition-all"
            >
              <a.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{a.label}</p>
                <p className="text-[10px] text-slate-400 font-light">{a.items} ações</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick peek — calculadoras */}
      <div className="px-5 md:px-8 pb-28">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-4">Calculadoras disponíveis</p>
        <div className="bg-[#0d1117] rounded-2xl overflow-hidden">
          {TOOLS_PREVIEW.map((t, i) => (
            <Link
              key={t.label}
              to={createPageUrl("ClientPortalCalculadoras")}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors ${i < TOOLS_PREVIEW.length - 1 ? "border-b border-white/[0.06]" : ""}`}
            >
              <t.icon className="w-4 h-4 text-white/40 flex-shrink-0" />
              <p className="text-sm text-white/70 font-light">{t.label}</p>
              <ChevronRight className="w-3.5 h-3.5 text-white/20 ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}