import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, TrendingUp, TrendingDown, Minus, BarChart3, Save, CheckCircle2 } from "lucide-react";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const KPI_GROUPS = [
  {
    label: "Tráfego",
    kpis: [
      { id: "visitantes",    label: "Visitantes únicos/mês",  prefix: "",    suffix: "",   hint: "Total de sessões únicas" },
      { id: "cpc",           label: "CPC médio",              prefix: "R$",  suffix: "",   hint: "Custo por clique médio" },
      { id: "ctr",           label: "CTR médio (%)",          prefix: "",    suffix: "%",  hint: "Taxa de cliques nos anúncios" },
      { id: "impressoes",    label: "Impressões/mês",         prefix: "",    suffix: "",   hint: "Total de impressões de anúncios" },
    ]
  },
  {
    label: "Conversão",
    kpis: [
      { id: "taxa_conv",     label: "Taxa de conversão (%)",  prefix: "",    suffix: "%",  hint: "% de visitantes que compram" },
      { id: "carrinhos",     label: "Carrinhos abandonados",  prefix: "",    suffix: "%",  hint: "% de carrinhos não finalizados" },
      { id: "reviews",       label: "Reviews recebidos",      prefix: "",    suffix: "",   hint: "Novos reviews no mês" },
      { id: "nps",           label: "NPS",                    prefix: "",    suffix: "",   hint: "Net Promoter Score (-100 a 100)" },
    ]
  },
  {
    label: "Financeiro",
    kpis: [
      { id: "faturamento",   label: "Faturamento bruto",      prefix: "R$",  suffix: "",   hint: "Receita total do mês" },
      { id: "ticket_medio",  label: "Ticket médio",           prefix: "R$",  suffix: "",   hint: "Valor médio por pedido" },
      { id: "pedidos",       label: "Pedidos no mês",         prefix: "",    suffix: "",   hint: "Total de pedidos confirmados" },
      { id: "margem",        label: "Margem líquida (%)",     prefix: "",    suffix: "%",  hint: "Lucro líquido / receita" },
    ]
  },
  {
    label: "Retenção",
    kpis: [
      { id: "cac",           label: "CAC",                    prefix: "R$",  suffix: "",   hint: "Custo de aquisição de cliente" },
      { id: "ltv",           label: "LTV",                    prefix: "R$",  suffix: "",   hint: "Valor de vida do cliente" },
      { id: "recompra",      label: "Taxa de recompra (%)",   prefix: "",    suffix: "%",  hint: "% de clientes que voltam" },
      { id: "churn",         label: "Churn (%)",              prefix: "",    suffix: "%",  hint: "% de clientes perdidos/mês" },
    ]
  },
];

const STORAGE_KEY = "client_kpis_v1";
function getStoredKPIs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function Trend({ current, previous }) {
  if (!previous || previous === 0) return <Minus className="w-3.5 h-3.5 text-slate-300" />;
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 1) return <Minus className="w-3.5 h-3.5 text-slate-300" />;
  if (diff > 0) return (
    <div className="flex items-center gap-1">
      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
      <span className="text-[10px] text-emerald-500 font-medium">+{diff.toFixed(1)}%</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1">
      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
      <span className="text-[10px] text-rose-500 font-medium">{diff.toFixed(1)}%</span>
    </div>
  );
}

export default function ClientPortalKPIs() {
  const mesAtual = new Date().getMonth(); // 0-indexed
  const [selectedMes, setSelectedMes] = useState(mesAtual);
  const [kpis, setKpis] = useState(() => getStoredKPIs());
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const mesKey = (mes) => `2026_${mes}`;

  const getValue = (kpiId, mes = selectedMes) => kpis[mesKey(mes)]?.[kpiId] || "";
  const getMesAnterior = (kpiId) => {
    const prev = selectedMes > 0 ? selectedMes - 1 : null;
    return prev !== null ? parseFloat(kpis[mesKey(prev)]?.[kpiId] || "0") : null;
  };

  const setValue = (kpiId, val) => {
    const key = mesKey(selectedMes);
    setKpis(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [kpiId]: val }
    }));
  };

  const saveAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kpis));
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const faturamento = parseFloat(getValue("faturamento")) || 0;
  const pedidos = parseFloat(getValue("pedidos")) || 0;
  const cac = parseFloat(getValue("cac")) || 0;
  const ltv = parseFloat(getValue("ltv")) || 0;
  const margem = parseFloat(getValue("margem")) || 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="w-full px-5 md:px-8 pt-28 md:pt-12 pb-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to={createPageUrl("ClientPortalFerramentas")} className="flex items-center gap-1.5 text-xs text-slate-400 font-light hover:text-slate-600 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            Ferramentas
          </Link>
          <button
            onClick={editMode ? saveAll : () => setEditMode(true)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-all ${editMode ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? "Salvo!" : editMode ? "Salvar" : "Editar"}
          </button>
        </div>

        <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">Dashboard</p>
        <h1 className="text-7xl md:text-6xl font-extralight text-slate-900 tracking-tight leading-[1.1] mb-2">KPIs</h1>
        <p className="text-slate-400 font-light text-sm">Métricas mensais do seu e-commerce</p>
      </div>

      {/* Seletor de mês */}
      <div className="px-5 md:px-8 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MESES.map((m, i) => (
            <button
              key={m}
              onClick={() => setSelectedMes(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all ${selectedMes === i ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {faturamento > 0 && (
        <div className="px-5 md:px-8 pb-4">
          <div className="bg-[#0d1117] rounded-2xl px-5 py-5 grid grid-cols-2 gap-4">
            {[
              { label: "Faturamento", value: `R$${faturamento.toLocaleString("pt-BR")}`, kpiId: "faturamento" },
              { label: "Pedidos",     value: pedidos.toLocaleString("pt-BR"),             kpiId: "pedidos"     },
              { label: "Margem",      value: `${margem}%`,                               kpiId: "margem"      },
              { label: "LTV/CAC",     value: cac > 0 ? `${(ltv/cac).toFixed(1)}x` : "—", kpiId: null         },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-1">{item.label}</p>
                <p className="text-xl font-extralight text-white">{item.value}</p>
                {item.kpiId && (
                  <Trend current={parseFloat(getValue(item.kpiId))} previous={getMesAnterior(item.kpiId)} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Groups */}
      <div className="px-5 md:px-8 pb-28 space-y-6">
        {KPI_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">{group.label}</p>
            <div className="space-y-2">
              {group.kpis.map(kpi => {
                const val = getValue(kpi.id);
                const prev = getMesAnterior(kpi.id);
                return (
                  <div key={kpi.id} className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{kpi.label}</p>
                      <p className="text-[10px] text-slate-400 font-light mt-0.5">{kpi.hint}</p>
                    </div>
                    {editMode ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {kpi.prefix && <span className="text-sm text-slate-400 font-light">{kpi.prefix}</span>}
                        <input
                          type="number"
                          value={val}
                          onChange={e => setValue(kpi.id, e.target.value)}
                          className="w-24 h-9 text-right border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900 px-3 focus:outline-none focus:border-slate-400"
                          placeholder="0"
                        />
                        {kpi.suffix && <span className="text-sm text-slate-400 font-light">{kpi.suffix}</span>}
                      </div>
                    ) : (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-slate-900">
                          {val ? `${kpi.prefix}${parseFloat(val).toLocaleString("pt-BR")}${kpi.suffix}` : <span className="text-slate-300 font-light">—</span>}
                        </p>
                        {val && prev !== null && (
                          <div className="flex justify-end mt-0.5">
                            <Trend current={parseFloat(val)} previous={prev} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!editMode && faturamento === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 font-light text-sm">Sem dados para {MESES[selectedMes]}</p>
            <button onClick={() => setEditMode(true)} className="mt-4 text-xs text-slate-500 underline font-light">
              Inserir métricas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}