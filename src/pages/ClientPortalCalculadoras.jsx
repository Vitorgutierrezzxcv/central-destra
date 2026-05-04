import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ChevronLeft, Calculator, TrendingUp, DollarSign, RefreshCw,
  Link2, Filter, Zap, FileSpreadsheet, ChevronRight
} from "lucide-react";

// ─── Sub-components ────────────────────────────────────────────────

function Field({ label, value, onChange, prefix, suffix, type = "number", hint }) {
  return (
    <div>
      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-1.5">{label}</label>
      {hint && <p className="text-xs text-slate-400 font-light mb-2">{hint}</p>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-4 text-sm text-slate-400 font-light pointer-events-none">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full h-12 border border-slate-100 rounded-2xl bg-slate-50 text-sm text-slate-900 focus:outline-none focus:border-slate-300 focus:bg-white transition-all ${prefix ? "pl-8" : "pl-4"} ${suffix ? "pr-12" : "pr-4"}`}
        />
        {suffix && <span className="absolute right-4 text-sm text-slate-400 font-light pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

function Result({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-2xl px-5 py-4 ${highlight ? "bg-slate-900" : "bg-slate-50 border border-slate-100"}`}>
      <p className={`text-[10px] uppercase tracking-widest font-medium mb-1 ${highlight ? "text-white/40" : "text-slate-400"}`}>{label}</p>
      <p className={`text-2xl font-extralight ${highlight ? "text-white" : "text-slate-900"}`}>{value}</p>
      {sub && <p className={`text-[10px] font-light mt-0.5 ${highlight ? "text-white/30" : "text-slate-400"}`}>{sub}</p>}
    </div>
  );
}

function fmt(n, prefix = "R$") {
  if (isNaN(n) || !isFinite(n)) return "—";
  return `${prefix}${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtN(n, dec = 1) {
  if (isNaN(n) || !isFinite(n)) return "—";
  return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ─── Calculadoras ──────────────────────────────────────────────────

function CalcPrecificacao() {
  const [custo, setCusto] = useState("");
  const [impostos, setImpostos] = useState("10");
  const [frete, setFrete] = useState("0");
  const [marketing, setMarketing] = useState("15");
  const [margem, setMargem] = useState("30");

  const c = parseFloat(custo) || 0;
  const imp = parseFloat(impostos) / 100 || 0;
  const fr = parseFloat(frete) || 0;
  const mkt = parseFloat(marketing) / 100 || 0;
  const mg = parseFloat(margem) / 100 || 0;

  const divisor = 1 - imp - mkt - mg;
  const precoMinimo = divisor > 0 ? (c + fr) / divisor : 0;
  const lucro = precoMinimo * mg;

  return (
    <div className="space-y-4">
      <Field label="Custo do produto" value={custo} onChange={setCusto} prefix="R$" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Impostos (%)" value={impostos} onChange={setImpostos} suffix="%" />
        <Field label="Frete (R$)" value={frete} onChange={setFrete} prefix="R$" />
        <Field label="Marketing (%)" value={marketing} onChange={setMarketing} suffix="%" hint="% do preço final" />
        <Field label="Margem desejada (%)" value={margem} onChange={setMargem} suffix="%" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Result label="Preço mínimo" value={fmt(precoMinimo)} highlight />
        <Result label="Lucro por venda" value={fmt(lucro)} />
      </div>
    </div>
  );
}

function CalcROI() {
  const [investimento, setInvestimento] = useState("");
  const [receita, setReceita] = useState("");

  const inv = parseFloat(investimento) || 0;
  const rec = parseFloat(receita) || 0;
  const lucro = rec - inv;
  const roi = inv > 0 ? (lucro / inv) * 100 : 0;
  const roas = inv > 0 ? rec / inv : 0;

  return (
    <div className="space-y-4">
      <Field label="Investimento total" value={investimento} onChange={setInvestimento} prefix="R$" />
      <Field label="Receita gerada" value={receita} onChange={setReceita} prefix="R$" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Result label="ROI" value={`${fmtN(roi)}%`} highlight />
        <Result label="ROAS" value={`${fmtN(roas)}x`} />
        <Result label="Lucro" value={fmt(lucro)} />
        <Result label="Para cada R$1" value={`R$${fmtN(roas, 2)}`} sub="retornado" />
      </div>
    </div>
  );
}

function CalcCAC() {
  const [investimento, setInvestimento] = useState("");
  const [clientes, setClientes] = useState("");
  const [ticketMedio, setTicketMedio] = useState("");

  const inv = parseFloat(investimento) || 0;
  const cl = parseFloat(clientes) || 1;
  const tk = parseFloat(ticketMedio) || 0;

  const cac = inv / cl;
  const roi = tk > 0 ? ((tk - cac) / cac) * 100 : 0;

  return (
    <div className="space-y-4">
      <Field label="Investimento em marketing (mês)" value={investimento} onChange={setInvestimento} prefix="R$" />
      <Field label="Novos clientes (mês)" value={clientes} onChange={setClientes} />
      <Field label="Ticket médio" value={ticketMedio} onChange={setTicketMedio} prefix="R$" hint="Receita média por cliente" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Result label="CAC" value={fmt(cac)} highlight />
        <Result label="ROI por cliente" value={`${fmtN(roi)}%`} />
        <Result label="Lucro por cliente" value={fmt(tk - cac)} />
      </div>
    </div>
  );
}

function CalcLTV() {
  const [ticketMedio, setTicketMedio] = useState("");
  const [frequencia, setFrequencia] = useState("");
  const [meses, setMeses] = useState("");
  const [margem, setMargem] = useState("");

  const tk = parseFloat(ticketMedio) || 0;
  const fr = parseFloat(frequencia) || 0;
  const ms = parseFloat(meses) || 0;
  const mg = parseFloat(margem) / 100 || 0;

  const ltv = tk * fr * ms;
  const ltvLiquido = ltv * mg;
  const receitaAnual = tk * fr * 12;

  return (
    <div className="space-y-4">
      <Field label="Ticket médio" value={ticketMedio} onChange={setTicketMedio} prefix="R$" />
      <Field label="Compras por mês" value={frequencia} onChange={setFrequencia} hint="Frequência média de compras" />
      <Field label="Tempo de retenção (meses)" value={meses} onChange={setMeses} />
      <Field label="Margem líquida (%)" value={margem} onChange={setMargem} suffix="%" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Result label="LTV" value={fmt(ltv)} highlight />
        <Result label="LTV Líquido" value={fmt(ltvLiquido)} />
        <Result label="Receita anual/cliente" value={fmt(receitaAnual)} />
      </div>
    </div>
  );
}

function BuilderUTM() {
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const params = new URLSearchParams();
  if (source)   params.set("utm_source",   source);
  if (medium)   params.set("utm_medium",   medium);
  if (campaign) params.set("utm_campaign", campaign);
  if (content)  params.set("utm_content",  content);
  if (term)     params.set("utm_term",     term);

  const finalUrl = url ? `${url}${url.includes("?") ? "&" : "?"}${params.toString()}` : "";

  const copy = () => {
    if (!finalUrl) return;
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <Field label="URL do site" value={url} onChange={setUrl} type="text" hint="Ex: https://sualoja.com.br/produto" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="utm_source" value={source} onChange={setSource} type="text" hint="Ex: facebook" />
        <Field label="utm_medium" value={medium} onChange={setMedium} type="text" hint="Ex: cpc" />
        <Field label="utm_campaign" value={campaign} onChange={setCampaign} type="text" hint="Ex: black-friday" />
        <Field label="utm_content" value={content} onChange={setContent} type="text" hint="Ex: banner-topo" />
      </div>
      <Field label="utm_term" value={term} onChange={setTerm} type="text" hint="Ex: tenis-masculino" />
      {finalUrl && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-2">URL gerada</p>
          <p className="text-xs text-slate-600 font-light break-all leading-relaxed">{finalUrl}</p>
          <button
            onClick={copy}
            className={`mt-3 px-4 py-2 rounded-xl text-xs font-medium transition-all ${copied ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
          >
            {copied ? "Copiado!" : "Copiar URL"}
          </button>
        </div>
      )}
    </div>
  );
}

function PlanejadorFunil() {
  const [visitantes, setVisitantes] = useState("");
  const [txPdp, setTxPdp] = useState("40");
  const [txCart, setTxCart] = useState("15");
  const [txCheckout, setTxCheckout] = useState("60");
  const [ticket, setTicket] = useState("");

  const v = parseFloat(visitantes) || 0;
  const pdp = v * (parseFloat(txPdp) / 100 || 0);
  const cart = pdp * (parseFloat(txCart) / 100 || 0);
  const checkout = cart * (parseFloat(txCheckout) / 100 || 0);
  const receita = checkout * (parseFloat(ticket) || 0);
  const txGeral = v > 0 ? (checkout / v) * 100 : 0;

  const stages = [
    { label: "Visitantes",        value: Math.round(v),        pct: 100 },
    { label: "Viram produto",     value: Math.round(pdp),      pct: parseFloat(txPdp) || 0 },
    { label: "Adicionaram cart.", value: Math.round(cart),     pct: parseFloat(txCart) || 0 },
    { label: "Compraram",         value: Math.round(checkout), pct: parseFloat(txCheckout) || 0 },
  ];

  return (
    <div className="space-y-4">
      <Field label="Visitantes mensais" value={visitantes} onChange={setVisitantes} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Visitante → PDP (%)" value={txPdp} onChange={setTxPdp} suffix="%" />
        <Field label="PDP → Carrinho (%)" value={txCart} onChange={setTxCart} suffix="%" />
        <Field label="Cart. → Compra (%)" value={txCheckout} onChange={setTxCheckout} suffix="%" />
        <Field label="Ticket médio" value={ticket} onChange={setTicket} prefix="R$" />
      </div>

      {v > 0 && (
        <div className="bg-[#0d1117] rounded-2xl px-5 py-5 space-y-3">
          {stages.map((s, i) => (
            <div key={s.label} className="space-y-1">
              <div className="flex justify-between items-center">
                <p className="text-xs text-white/50 font-light">{s.label}</p>
                <p className="text-xs text-white/80 font-medium">{s.value.toLocaleString("pt-BR")}</p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div className="bg-white/60 h-1 rounded-full transition-all" style={{ width: `${Math.min(s.pct, 100)}%` }} />
              </div>
            </div>
          ))}
          <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Tx. conversão geral</p>
              <p className="text-xl font-extralight text-white">{fmtN(txGeral)}%</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Receita estimada</p>
              <p className="text-xl font-extralight text-white">{fmt(receita)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanejadorTrafego() {
  const [meta, setMeta] = useState("");
  const [ticket, setTicket] = useState("");
  const [txConv, setTxConv] = useState("1.5");
  const [cpc, setCpc] = useState("");

  const metaR = parseFloat(meta) || 0;
  const tk = parseFloat(ticket) || 1;
  const tc = parseFloat(txConv) / 100 || 0.015;
  const cpcV = parseFloat(cpc) || 0;

  const pedidosNecessarios = tk > 0 ? metaR / tk : 0;
  const visitantesNecessarios = tc > 0 ? pedidosNecessarios / tc : 0;
  const investimentoNecessario = cpcV > 0 ? visitantesNecessarios * cpcV : 0;
  const roas = investimentoNecessario > 0 ? metaR / investimentoNecessario : 0;

  return (
    <div className="space-y-4">
      <Field label="Meta de faturamento" value={meta} onChange={setMeta} prefix="R$" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ticket médio" value={ticket} onChange={setTicket} prefix="R$" />
        <Field label="Taxa de conversão (%)" value={txConv} onChange={setTxConv} suffix="%" />
        <Field label="CPC médio" value={cpc} onChange={setCpc} prefix="R$" hint="Custo por clique" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Result label="Pedidos necessários" value={fmtN(pedidosNecessarios, 0)} highlight />
        <Result label="Visitantes necessários" value={fmtN(visitantesNecessarios, 0)} />
        <Result label="Investimento estimado" value={fmt(investimentoNecessario)} />
        <Result label="ROAS esperado" value={`${fmtN(roas)}x`} />
      </div>
    </div>
  );
}

function ProjecaoDRE() {
  const [receita, setReceita] = useState("");
  const [cmv, setCmv] = useState("40");
  const [marketing, setMarketing] = useState("15");
  const [fixo, setFixo] = useState("");
  const [impostos, setImpostos] = useState("10");

  const rec = parseFloat(receita) || 0;
  const cmvV = rec * (parseFloat(cmv) / 100 || 0);
  const mktV = rec * (parseFloat(marketing) / 100 || 0);
  const fixoV = parseFloat(fixo) || 0;
  const impV = rec * (parseFloat(impostos) / 100 || 0);

  const lucroBruto = rec - cmvV - impV;
  const ebitda = lucroBruto - mktV - fixoV;
  const margemLiquida = rec > 0 ? (ebitda / rec) * 100 : 0;

  const rows = [
    { label: "Receita Bruta",      value: fmt(rec),               indent: false, bold: false },
    { label: "(-) Impostos",       value: `- ${fmt(impV)}`,       indent: true,  bold: false },
    { label: "(-) CMV",            value: `- ${fmt(cmvV)}`,       indent: true,  bold: false },
    { label: "= Lucro Bruto",      value: fmt(lucroBruto),        indent: false, bold: true  },
    { label: "(-) Marketing",      value: `- ${fmt(mktV)}`,       indent: true,  bold: false },
    { label: "(-) Custos Fixos",   value: `- ${fmt(fixoV)}`,      indent: true,  bold: false },
    { label: "= EBITDA",           value: fmt(ebitda),            indent: false, bold: true  },
  ];

  return (
    <div className="space-y-4">
      <Field label="Receita bruta mensal" value={receita} onChange={setReceita} prefix="R$" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="CMV (%)" value={cmv} onChange={setCmv} suffix="%" hint="Custo de mercadoria" />
        <Field label="Impostos (%)" value={impostos} onChange={setImpostos} suffix="%" />
        <Field label="Marketing (%)" value={marketing} onChange={setMarketing} suffix="%" />
        <Field label="Custos fixos (R$)" value={fixo} onChange={setFixo} prefix="R$" />
      </div>

      {rec > 0 && (
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          {rows.map((r, i) => (
            <div key={r.label} className={`flex justify-between items-center px-5 py-3 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} ${r.bold ? "border-t border-slate-100" : ""}`}>
              <p className={`text-sm font-light ${r.indent ? "text-slate-500 pl-4" : "text-slate-900"} ${r.bold ? "font-medium" : ""}`}>{r.label}</p>
              <p className={`text-sm font-light ${r.bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>{r.value}</p>
            </div>
          ))}
          <div className="bg-slate-900 flex justify-between items-center px-5 py-4">
            <p className="text-sm font-medium text-white">Margem Líquida</p>
            <p className="text-lg font-extralight text-white">{fmtN(margemLiquida)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────

const CALCULADORAS = [
  { id: "precificacao", label: "Precificação",      icon: Calculator,      sub: "Preço mínimo de venda",          component: CalcPrecificacao },
  { id: "roi",          label: "ROI",               icon: TrendingUp,      sub: "Retorno sobre investimento",     component: CalcROI },
  { id: "cac",          label: "CAC",               icon: DollarSign,      sub: "Custo de aquisição de cliente",  component: CalcCAC },
  { id: "ltv",          label: "LTV",               icon: RefreshCw,       sub: "Valor do ciclo de vida",         component: CalcLTV },
  { id: "utm",          label: "Construtor UTM",    icon: Link2,           sub: "Gere links rastreados",          component: BuilderUTM },
  { id: "funil",        label: "Planejador de Funil", icon: Filter,        sub: "Simule seu funil de vendas",     component: PlanejadorFunil },
  { id: "trafego",      label: "Planejador de Tráfego", icon: Zap,         sub: "Quanto investir para sua meta", component: PlanejadorTrafego },
  { id: "dre",          label: "Projeção de DRE",   icon: FileSpreadsheet, sub: "Simule seu resultado mensal",    component: ProjecaoDRE },
];

export default function ClientPortalCalculadoras() {
  const [active, setActive] = useState(null);

  const ActiveCalc = active ? CALCULADORAS.find(c => c.id === active)?.component : null;
  const activeData = active ? CALCULADORAS.find(c => c.id === active) : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="w-full px-5 md:px-8 pt-28 md:pt-12 pb-6">
        <div className="flex items-center gap-3 mb-6">
          {active ? (
            <button onClick={() => setActive(null)} className="flex items-center gap-1.5 text-xs text-slate-400 font-light hover:text-slate-600 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
              Calculadoras
            </button>
          ) : (
            <Link to={createPageUrl("ClientPortalFerramentas")} className="flex items-center gap-1.5 text-xs text-slate-400 font-light hover:text-slate-600 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
              Ferramentas
            </Link>
          )}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">
              {active ? activeData?.sub : "Ferramentas"}
            </p>
            <h1 className="text-6xl md:text-5xl font-extralight text-slate-900 tracking-tight leading-[1.1]">
              {active ? activeData?.label : "Calculadoras"}
            </h1>
          </div>
          {active && activeData && (
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0">
              <activeData.icon className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 md:px-8 pb-28">
        {!active ? (
          <div className="space-y-3">
            {CALCULADORAS.map(calc => (
              <button
                key={calc.id}
                onClick={() => setActive(calc.id)}
                className="w-full text-left flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-5 py-4 hover:border-slate-200 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-900 transition-colors">
                  <calc.icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{calc.label}</p>
                  <p className="text-xs text-slate-400 font-light mt-0.5">{calc.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          ActiveCalc && <ActiveCalc />
        )}
      </div>
    </div>
  );
}