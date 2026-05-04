import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Zap, ArrowRight, DollarSign, Target, TrendingUp, ShoppingCart } from "lucide-react";

const CANAIS = [
  { id: "meta",      label: "Meta Ads",    color: "#1877F2", light: "#EBF3FF", border: "#BFDBFE" },
  { id: "google",    label: "Google Ads",  color: "#4285F4", light: "#F0F4FF", border: "#C7D7FC" },
  { id: "tiktok",   label: "TikTok Ads",  color: "#010101", light: "#F5F5F5", border: "#E2E2E2" },
  { id: "pinterest", label: "Pinterest",   color: "#E60023", light: "#FFF0F1", border: "#FECDD3" },
];

function fmt(n) {
  if (!n || isNaN(n) || !isFinite(n)) return "—";
  return `R$${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtN(n, dec = 0) {
  if (!n || isNaN(n) || !isFinite(n)) return "—";
  return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default function ClientPortalPlanejadorTrafego() {
  const [investimento, setInvestimento] = useState("");
  const [ticket, setTicket] = useState("");
  const [canaisSel, setCanaisSel] = useState({ meta: true, google: false, tiktok: false, pinterest: false });
  const [pcts, setPcts] = useState({ meta: 100, google: 0, tiktok: 0, pinterest: 0 });
  const [cacs, setCacs] = useState({ meta: "", google: "", tiktok: "", pinterest: "" });

  const inv = parseFloat(investimento) || 0;
  const tk = parseFloat(ticket) || 0;
  const ativos = CANAIS.filter(c => canaisSel[c.id]);

  const toggleCanal = (id) => {
    const next = { ...canaisSel, [id]: !canaisSel[id] };
    setCanaisSel(next);
    // Redistribuir % igualmente entre ativos
    const ativosNext = CANAIS.filter(c => next[c.id]);
    if (ativosNext.length === 0) return;
    const base = Math.floor(100 / ativosNext.length);
    const resto = 100 - base * ativosNext.length;
    const newPcts = { meta: 0, google: 0, tiktok: 0, pinterest: 0 };
    ativosNext.forEach((c, i) => { newPcts[c.id] = base + (i === 0 ? resto : 0); });
    setPcts(newPcts);
  };

  const setPct = (id, val) => {
    const v = Math.max(0, Math.min(100, parseInt(val) || 0));
    // Ajustar os demais para somar 100
    const outros = ativos.filter(c => c.id !== id);
    const restante = 100 - v;
    const totalOutros = outros.reduce((s, c) => s + pcts[c.id], 0);
    const newPcts = { ...pcts, [id]: v };
    if (outros.length > 0 && totalOutros > 0) {
      outros.forEach(c => {
        newPcts[c.id] = Math.round((pcts[c.id] / totalOutros) * restante);
      });
      // Corrigir arredondamento
      const soma = Object.values(newPcts).reduce((a, b) => a + b, 0);
      if (soma !== 100 && outros.length > 0) {
        newPcts[outros[0].id] += (100 - soma);
      }
    }
    setPcts(newPcts);
  };

  const totalPct = ativos.reduce((s, c) => s + (pcts[c.id] || 0), 0);

  const resultados = ativos.map(canal => {
    const budget = inv * (pcts[canal.id] / 100);
    const cac = parseFloat(cacs[canal.id]) || 0;
    const vendas = cac > 0 ? Math.floor(budget / cac) : 0;
    const receita = vendas * tk;
    const roas = budget > 0 ? receita / budget : 0;
    return { ...canal, budget, cac, vendas, receita, roas };
  });

  const totalReceita = resultados.reduce((s, r) => s + r.receita, 0);
  const totalVendas = resultados.reduce((s, r) => s + r.vendas, 0);
  const totalRoas = inv > 0 ? totalReceita / inv : 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="w-full px-5 md:px-8 pt-28 md:pt-12 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl("ClientPortalFerramentas")} className="flex items-center gap-1.5 text-xs text-slate-400 font-light hover:text-slate-600 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            Ferramentas
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-1">Ferramenta</p>
            <h1 className="text-4xl md:text-3xl font-extralight text-slate-900 tracking-tight">Planejador de Tráfego Pago</h1>
          </div>
        </div>
        <p className="text-slate-400 font-light text-sm mt-3">Simule seu investimento por canal e projete vendas com base no CAC desejado</p>
      </div>

      <div className="px-5 md:px-8 pb-28 space-y-6">

        {/* Inputs globais */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-1.5">Investimento total</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-sm text-slate-400 font-light pointer-events-none">R$</span>
              <input
                type="number"
                value={investimento}
                onChange={e => setInvestimento(e.target.value)}
                placeholder="0"
                className="w-full h-12 border border-slate-100 rounded-2xl bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:bg-white transition-all pl-8 pr-4"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-1.5">Ticket médio</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-sm text-slate-400 font-light pointer-events-none">R$</span>
              <input
                type="number"
                value={ticket}
                onChange={e => setTicket(e.target.value)}
                placeholder="0"
                className="w-full h-12 border border-slate-100 rounded-2xl bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:bg-white transition-all pl-8 pr-4"
              />
            </div>
          </div>
        </div>

        {/* Seleção de canais */}
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">Canais de investimento</p>
          <div className="grid grid-cols-2 gap-2">
            {CANAIS.map(canal => (
              <button
                key={canal.id}
                onClick={() => toggleCanal(canal.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${canaisSel[canal.id] ? "border-slate-900 bg-slate-900" : "border-slate-100 bg-white hover:border-slate-200"}`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: canaisSel[canal.id] ? "#fff" : canal.color }} />
                <span className={`text-sm font-medium ${canaisSel[canal.id] ? "text-white" : "text-slate-700"}`}>{canal.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Distribuição por canal */}
        {ativos.length > 0 && inv > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Distribuição do budget</p>
              <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${totalPct === 100 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
                {totalPct}% de 100%
              </span>
            </div>
            <div className="space-y-3">
              {ativos.map(canal => {
                const budget = inv * (pcts[canal.id] || 0) / 100;
                return (
                  <div key={canal.id} className="border border-slate-100 rounded-2xl px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: canal.color }} />
                        <span className="text-sm font-medium text-slate-800">{canal.label}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-light">{fmt(budget)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={pcts[canal.id] || 0}
                        onChange={e => setPct(canal.id, e.target.value)}
                        className="flex-1 h-1.5 appearance-none bg-slate-100 rounded-full outline-none cursor-pointer"
                        style={{ accentColor: canal.color }}
                      />
                      <div className="relative flex items-center w-16">
                        <input
                          type="number"
                          value={pcts[canal.id] || 0}
                          onChange={e => setPct(canal.id, e.target.value)}
                          className="w-16 h-9 text-center border border-slate-100 rounded-xl bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-slate-300"
                        />
                        <span className="absolute right-2 text-xs text-slate-400 pointer-events-none">%</span>
                      </div>
                    </div>
                    {/* CAC desejado */}
                    <div className="mt-3 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      <label className="text-xs text-slate-400 font-light whitespace-nowrap">CAC desejado</label>
                      <div className="relative flex items-center flex-1">
                        <span className="absolute left-3 text-xs text-slate-400 pointer-events-none">R$</span>
                        <input
                          type="number"
                          value={cacs[canal.id]}
                          onChange={e => setCacs(p => ({ ...p, [canal.id]: e.target.value }))}
                          placeholder="0"
                          className="w-full h-8 pl-8 pr-3 border border-slate-100 rounded-xl bg-slate-50 text-xs text-slate-900 focus:outline-none focus:border-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Flow de resultados */}
        {ativos.length > 0 && inv > 0 && totalVendas > 0 && (
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-4">Projeção de resultados</p>

            {/* Resumo geral */}
            <div className="bg-[#0d1117] rounded-2xl px-5 py-5 mb-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Investimento</p>
                <p className="text-lg font-extralight text-white">{fmt(inv)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Vendas est.</p>
                <p className="text-lg font-extralight text-white">{fmtN(totalVendas)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Receita est.</p>
                <p className="text-lg font-extralight text-white">{fmt(totalReceita)}</p>
              </div>
              <div className="col-span-3 border-t border-white/10 pt-3 flex items-center justify-between">
                <p className="text-xs text-white/40 font-light">ROAS consolidado</p>
                <p className="text-xl font-extralight text-white">{fmtN(totalRoas, 1)}x</p>
              </div>
            </div>

            {/* Flow por canal */}
            <div className="space-y-3">
              {resultados.map((r, i) => (
                <div key={r.id}>
                  <div className="border rounded-2xl overflow-hidden" style={{ borderColor: r.border }}>
                    {/* Header canal */}
                    <div className="px-5 py-3 flex items-center justify-between" style={{ background: r.light }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                        <span className="text-sm font-semibold text-slate-800">{r.label}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-600">{pcts[r.id]}% · {fmt(r.budget)}</span>
                    </div>
                    {/* Flow interno */}
                    <div className="px-5 py-4 bg-white grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <DollarSign className="w-4 h-4 text-slate-300 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Budget</p>
                        <p className="text-base font-light text-slate-900">{fmt(r.budget)}</p>
                      </div>
                      <div className="text-center relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-px bg-slate-200" />
                        <Target className="w-4 h-4 text-slate-300 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">CAC</p>
                        <p className="text-base font-light text-slate-900">{r.cac > 0 ? fmt(r.cac) : <span className="text-slate-300">—</span>}</p>
                      </div>
                      <div className="text-center relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-px bg-slate-200" />
                        <ShoppingCart className="w-4 h-4 text-slate-300 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Vendas</p>
                        <p className="text-base font-semibold text-slate-900">{r.cac > 0 ? fmtN(r.vendas) : <span className="text-slate-300 font-light">—</span>}</p>
                      </div>
                    </div>
                    {r.cac > 0 && r.receita > 0 && (
                      <div className="px-5 py-3 bg-slate-50 border-t flex items-center justify-between" style={{ borderColor: r.border }}>
                        <span className="text-xs text-slate-500 font-light">Receita estimada</span>
                        <span className="text-sm font-semibold text-slate-900">{fmt(r.receita)}</span>
                        <span className="text-xs text-slate-400 font-light">ROAS {fmtN(r.roas, 1)}x</span>
                      </div>
                    )}
                  </div>
                  {i < resultados.length - 1 && (
                    <div className="flex justify-center my-1">
                      <div className="w-px h-4 bg-slate-200" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {ativos.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-light text-sm">Selecione ao menos um canal para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}