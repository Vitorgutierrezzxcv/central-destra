import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Link2, Copy, Check, Info, ArrowRight, Globe, Megaphone, Tag, MousePointerClick, Search } from "lucide-react";

const UTM_FIELDS = [
  {
    id: "source",
    param: "utm_source",
    label: "Fonte (utm_source)",
    placeholder: "Ex: facebook, google, instagram",
    icon: Globe,
    required: true,
    tip: "Identifica de onde veio o tráfego. Use o nome da plataforma ou veículo.",
    why: "Permite saber qual canal está gerando visitas para o seu site.",
    examples: ["facebook", "google", "instagram", "tiktok", "email", "youtube", "pinterest"],
  },
  {
    id: "medium",
    param: "utm_medium",
    label: "Mídia (utm_medium)",
    placeholder: "Ex: cpc, email, organic, social",
    icon: Megaphone,
    required: true,
    tip: "Define o tipo de tráfego — pago, orgânico, email, social, etc.",
    why: "Ajuda a separar tráfego pago de orgânico, e-mail de social, etc.",
    examples: ["cpc", "email", "social", "organic", "banner", "referral", "influencer"],
  },
  {
    id: "campaign",
    param: "utm_campaign",
    label: "Campanha (utm_campaign)",
    placeholder: "Ex: black-friday-2024, lancamento-produto",
    icon: Tag,
    required: true,
    tip: "Nome da campanha específica. Use nomes descritivos sem espaços.",
    why: "Permite comparar o desempenho de campanhas diferentes.",
    examples: ["black-friday", "natal-2024", "lancamento", "retencao-clientes", "upsell-kit"],
  },
  {
    id: "content",
    param: "utm_content",
    label: "Conteúdo (utm_content)",
    placeholder: "Ex: banner-topo, botao-comprar, post-video",
    icon: MousePointerClick,
    required: false,
    tip: "Diferencia criativos dentro de uma mesma campanha. Ideal para testes A/B.",
    why: "Descubra qual criativo, banner ou CTA performa melhor.",
    examples: ["banner-topo", "botao-verde", "post-carrossel", "video-60s", "stories"],
  },
  {
    id: "term",
    param: "utm_term",
    label: "Termo (utm_term)",
    placeholder: "Ex: tenis-masculino, maquiagem-vegana",
    icon: Search,
    required: false,
    tip: "Palavra-chave que acionou o anúncio. Usado principalmente em Google Ads.",
    why: "Identifica quais termos de busca estão convertendo melhor.",
    examples: ["tenis-branco", "creme-facial", "vestido-festa", "suplemento-proteina"],
  },
];

export default function ClientPortalUTMBuilder() {
  const [url, setUrl] = useState("");
  const [values, setValues] = useState({ source: "", medium: "", campaign: "", content: "", term: "" });
  const [expandedTip, setExpandedTip] = useState(null);
  const [copied, setCopied] = useState(false);
  const [urlError, setUrlError] = useState(false);

  const setValue = (id, val) => setValues(p => ({ ...p, [id]: val.replace(/\s+/g, "-").toLowerCase() }));
  const fillExample = (id, val) => setValues(p => ({ ...p, [id]: val }));

  const params = new URLSearchParams();
  if (values.source)   params.set("utm_source",   values.source);
  if (values.medium)   params.set("utm_medium",   values.medium);
  if (values.campaign) params.set("utm_campaign", values.campaign);
  if (values.content)  params.set("utm_content",  values.content);
  if (values.term)     params.set("utm_term",      values.term);

  const cleanUrl = url.trim().replace(/\/$/, "");
  const finalUrl = cleanUrl && values.source && values.medium && values.campaign
    ? `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}${params.toString()}`
    : "";

  const isReady = !!finalUrl;

  const copy = () => {
    if (!finalUrl) return;
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const validateUrl = (val) => {
    setUrl(val);
    if (val && !val.startsWith("http")) setUrlError(true);
    else setUrlError(false);
  };

  const completedFields = [values.source, values.medium, values.campaign, values.content, values.term]
    .filter(Boolean).length + (url ? 1 : 0);
  const totalFields = 6;

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

        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-1">Ferramenta gratuita</p>
            <h1 className="text-4xl md:text-3xl font-extralight text-slate-900 tracking-tight">Construtor de UTM</h1>
          </div>
        </div>

        {/* Por que usar UTM */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 mt-4">
          <p className="text-xs font-semibold text-blue-800 mb-1">Por que parametrizar seus links?</p>
          <p className="text-xs text-blue-700 font-light leading-relaxed">
            Sem UTMs, o Google Analytics não sabe de onde veio cada visita. Com UTMs, você descobre qual campanha, canal e criativo gera mais vendas — e otimiza onde investir.
          </p>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Preenchimento</p>
            <p className="text-[10px] text-slate-400 font-medium">{completedFields}/{totalFields}</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1">
            <div className="bg-slate-900 h-1 rounded-full transition-all duration-500" style={{ width: `${(completedFields / totalFields) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="px-5 md:px-8 pb-28 space-y-5">

        {/* URL do destino */}
        <div>
          <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-1.5">
            URL de destino <span className="text-rose-400">*</span>
          </label>
          <p className="text-xs text-slate-400 font-light mb-2">A página para onde o usuário será direcionado após clicar no link.</p>
          <input
            type="url"
            value={url}
            onChange={e => validateUrl(e.target.value)}
            placeholder="https://sualoja.com.br/produto"
            className={`w-full h-12 border rounded-2xl bg-slate-50 text-sm text-slate-900 focus:outline-none focus:bg-white transition-all px-4 ${urlError ? "border-rose-200 focus:border-rose-400" : "border-slate-100 focus:border-slate-300"}`}
          />
          {urlError && <p className="text-xs text-rose-400 font-light mt-1">A URL deve começar com http:// ou https://</p>}
        </div>

        {/* UTM Fields */}
        {UTM_FIELDS.map(field => {
          const isOpen = expandedTip === field.id;
          const hasValue = !!values[field.id];
          return (
            <div key={field.id}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                  {field.label}
                  {field.required && <span className="text-rose-400 ml-1">*</span>}
                  {!field.required && <span className="text-slate-300 ml-1">(opcional)</span>}
                </label>
                <button
                  onClick={() => setExpandedTip(isOpen ? null : field.id)}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Info className="w-3 h-3" />
                  <span className="font-light">Por que usar?</span>
                </button>
              </div>

              {/* Tip expandível */}
              {isOpen && (
                <div className="mb-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-slate-700 mb-1">{field.tip}</p>
                  <p className="text-xs text-slate-500 font-light">{field.why}</p>
                </div>
              )}

              <div className="relative">
                <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                <input
                  type="text"
                  value={values[field.id]}
                  onChange={e => setValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full h-12 pl-10 pr-4 border rounded-2xl text-sm text-slate-900 focus:outline-none transition-all ${hasValue ? "border-slate-300 bg-white" : "border-slate-100 bg-slate-50 focus:border-slate-300 focus:bg-white"}`}
                />
              </div>

              {/* Exemplos rápidos */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {field.examples.map(ex => (
                  <button
                    key={ex}
                    onClick={() => fillExample(field.id, ex)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-all ${values[field.id] === ex ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:text-slate-700"}`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Resultado */}
        {isReady ? (
          <div className="bg-[#0d1117] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-2">Link gerado</p>
              <p className="text-xs text-white/60 font-light break-all leading-relaxed">{finalUrl}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-3">Parâmetros aplicados</p>
              <div className="space-y-1.5">
                {[
                  ["utm_source", values.source],
                  ["utm_medium", values.medium],
                  ["utm_campaign", values.campaign],
                  values.content ? ["utm_content", values.content] : null,
                  values.term ? ["utm_term", values.term] : null,
                ].filter(Boolean).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[10px] text-white/30 w-28 flex-shrink-0">{key}</span>
                    <ArrowRight className="w-3 h-3 text-white/20 flex-shrink-0" />
                    <span className="text-xs text-white/70 font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={copy}
                className={`w-full py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${copied ? "bg-emerald-500 text-white" : "bg-white text-slate-900 hover:bg-slate-100"}`}
              >
                {copied ? <><Check className="w-4 h-4" />Copiado!</> : <><Copy className="w-4 h-4" />Copiar link</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 rounded-2xl px-5 py-8 text-center">
            <Link2 className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-light text-sm">Preencha URL, fonte, mídia e campanha para gerar o link</p>
          </div>
        )}
      </div>
    </div>
  );
}