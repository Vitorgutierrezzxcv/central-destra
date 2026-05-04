import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, ChevronRight, CheckCircle2, Stethoscope, TrendingUp, ShoppingCart, DollarSign, RefreshCw, ArrowRight } from "lucide-react";

const ALAVANCAS_CONFIG = {
  trafego:   { label: "Tráfego",      icon: TrendingUp,   color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100"   },
  conversao: { label: "Conversão",    icon: ShoppingCart, color: "text-green-500",  bg: "bg-green-50",  border: "border-green-100"  },
  ticket:    { label: "Ticket Médio", icon: DollarSign,   color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100"  },
  retencao:  { label: "Retenção",     icon: RefreshCw,    color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
};

const PERGUNTAS = [
  {
    id: "visitantes",
    texto: "Quantos visitantes únicos seu site recebe por mês?",
    opcoes: [
      { label: "Menos de 1.000",   score: { trafego: 10, conversao: 2, ticket: 2, retencao: 2 } },
      { label: "1.000 – 5.000",    score: { trafego: 8,  conversao: 4, ticket: 3, retencao: 3 } },
      { label: "5.000 – 20.000",   score: { trafego: 4,  conversao: 8, ticket: 5, retencao: 5 } },
      { label: "Mais de 20.000",   score: { trafego: 2,  conversao: 5, ticket: 8, retencao: 8 } },
    ]
  },
  {
    id: "conversao",
    texto: "Qual é a sua taxa de conversão atual?",
    opcoes: [
      { label: "Não sei / não meço", score: { trafego: 2, conversao: 10, ticket: 2, retencao: 2 } },
      { label: "Menos de 1%",        score: { trafego: 2, conversao: 10, ticket: 3, retencao: 3 } },
      { label: "1% – 2%",            score: { trafego: 3, conversao: 6,  ticket: 6, retencao: 5 } },
      { label: "Mais de 2%",         score: { trafego: 5, conversao: 2,  ticket: 8, retencao: 8 } },
    ]
  },
  {
    id: "ticket",
    texto: "Qual é o seu ticket médio por pedido?",
    opcoes: [
      { label: "Menos de R$100",        score: { trafego: 3, conversao: 5, ticket: 10, retencao: 5 } },
      { label: "R$100 – R$250",         score: { trafego: 3, conversao: 4, ticket: 7,  retencao: 6 } },
      { label: "R$250 – R$500",         score: { trafego: 4, conversao: 4, ticket: 4,  retencao: 7 } },
      { label: "Mais de R$500",         score: { trafego: 5, conversao: 5, ticket: 2,  retencao: 9 } },
    ]
  },
  {
    id: "recompra",
    texto: "Com que frequência seus clientes recompram?",
    opcoes: [
      { label: "Raramente / nunca meço", score: { trafego: 3, conversao: 3, ticket: 3, retencao: 10 } },
      { label: "Menos de 10% recompram", score: { trafego: 3, conversao: 3, ticket: 4, retencao: 9  } },
      { label: "10% – 30% recompram",    score: { trafego: 4, conversao: 5, ticket: 5, retencao: 6  } },
      { label: "Mais de 30% recompram",  score: { trafego: 6, conversao: 6, ticket: 7, retencao: 3  } },
    ]
  },
  {
    id: "email",
    texto: "Você tem automações de e-mail/WhatsApp ativas?",
    opcoes: [
      { label: "Não tenho nenhuma",         score: { trafego: 2, conversao: 4, ticket: 4, retencao: 10 } },
      { label: "Só carrinho abandonado",    score: { trafego: 3, conversao: 5, ticket: 5, retencao: 7  } },
      { label: "Algumas automações",        score: { trafego: 5, conversao: 5, ticket: 6, retencao: 5  } },
      { label: "Fluxos completos ativos",   score: { trafego: 7, conversao: 7, ticket: 7, retencao: 2  } },
    ]
  },
  {
    id: "ads",
    texto: "Qual é sua principal fonte de tráfego hoje?",
    opcoes: [
      { label: "Só orgânico / não invisto em ads", score: { trafego: 10, conversao: 3, ticket: 3, retencao: 3 } },
      { label: "Invisto pouco em ads (< R$3k/mês)", score: { trafego: 8, conversao: 4, ticket: 4, retencao: 4 } },
      { label: "Invisto em ads regularmente",       score: { trafego: 4, conversao: 8, ticket: 5, retencao: 5 } },
      { label: "Forte investimento em ads",         score: { trafego: 2, conversao: 6, ticket: 8, retencao: 7 } },
    ]
  },
  {
    id: "reviews",
    texto: "Quantos reviews/avaliações seu site tem visíveis?",
    opcoes: [
      { label: "Não tenho reviews",         score: { trafego: 2, conversao: 10, ticket: 3, retencao: 3 } },
      { label: "Menos de 20 reviews",       score: { trafego: 3, conversao: 8,  ticket: 4, retencao: 4 } },
      { label: "20 – 100 reviews",          score: { trafego: 4, conversao: 5,  ticket: 6, retencao: 5 } },
      { label: "Mais de 100 reviews",       score: { trafego: 6, conversao: 3,  ticket: 7, retencao: 7 } },
    ]
  },
  {
    id: "faturamento",
    texto: "Qual é seu faturamento mensal atual?",
    opcoes: [
      { label: "Menos de R$10k",            score: { trafego: 10, conversao: 7,  ticket: 5, retencao: 3 } },
      { label: "R$10k – R$50k",             score: { trafego: 7,  conversao: 8,  ticket: 7, retencao: 5 } },
      { label: "R$50k – R$200k",            score: { trafego: 5,  conversao: 6,  ticket: 8, retencao: 7 } },
      { label: "Mais de R$200k",            score: { trafego: 3,  conversao: 4,  ticket: 6, retencao: 10 } },
    ]
  },
];

function calcularPrioridades(respostas) {
  const total = { trafego: 0, conversao: 0, ticket: 0, retencao: 0 };
  for (const [perguntaId, opcaoIdx] of Object.entries(respostas)) {
    const pergunta = PERGUNTAS.find(p => p.id === perguntaId);
    if (!pergunta) continue;
    const opcao = pergunta.opcoes[opcaoIdx];
    if (!opcao) continue;
    for (const [k, v] of Object.entries(opcao.score)) {
      total[k] += v;
    }
  }
  return Object.entries(total)
    .sort(([, a], [, b]) => b - a)
    .map(([key, score]) => ({ key, score, ...ALAVANCAS_CONFIG[key] }));
}

export default function ClientPortalDiagnostico() {
  const [step, setStep] = useState(0); // 0 = intro, 1-N = perguntas, N+1 = resultado
  const [respostas, setRespostas] = useState({});

  const totalPerguntas = PERGUNTAS.length;
  const isIntro = step === 0;
  const isResultado = step === totalPerguntas + 1;
  const perguntaAtual = isIntro || isResultado ? null : PERGUNTAS[step - 1];

  const prioridades = isResultado ? calcularPrioridades(respostas) : [];
  const pct = isResultado ? 100 : Math.round(((step - 1) / totalPerguntas) * 100);

  const responder = (idx) => {
    setRespostas(r => ({ ...r, [perguntaAtual.id]: idx }));
    setStep(s => s + 1);
  };

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

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">Diagnóstico</p>
            <h1 className="text-6xl md:text-5xl font-extralight text-slate-900 tracking-tight leading-[1.1]">
              {isResultado ? "Resultado" : "Qual é sua\nprioridade?"}
            </h1>
            <p className="text-slate-400 font-light text-sm mt-2">
              {isResultado ? "Sua ordem de foco personalizada" : "8 perguntas rápidas para descobrir seu foco"}
            </p>
          </div>
          {!isIntro && !isResultado && (
            <div className="text-right flex-shrink-0">
              <span className="text-3xl font-extralight text-slate-900">{step}</span>
              <span className="text-sm text-slate-300 font-light">/{totalPerguntas}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {!isIntro && (
          <div className="mt-5 w-full bg-slate-100 rounded-full h-[1.5px]">
            <div className="bg-slate-900 h-[1.5px] rounded-full transition-all duration-500" style={{ width: `${isResultado ? 100 : pct}%` }} />
          </div>
        )}
      </div>

      <div className="px-5 md:px-8 pb-28 flex-1">

        {/* Intro */}
        {isIntro && (
          <div className="space-y-6">
            <div className="bg-[#0d1117] rounded-2xl px-6 py-6">
              <Stethoscope className="w-8 h-8 text-white/40 mb-4" />
              <p className="text-white font-light text-sm leading-relaxed mb-2">
                Responda 8 perguntas sobre seu negócio e descubra qual das 4 alavancas de crescimento deve ser sua prioridade agora.
              </p>
              <p className="text-white/30 text-xs font-light">Tempo estimado: 2 minutos</p>
            </div>

            <div className="space-y-3">
              {Object.entries(ALAVANCAS_CONFIG).map(([key, a]) => (
                <div key={key} className={`flex items-center gap-3 border ${a.border} ${a.bg} rounded-2xl px-4 py-3`}>
                  <a.icon className={`w-4 h-4 ${a.color} flex-shrink-0`} />
                  <p className="text-sm font-medium text-slate-800">{a.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-slate-900 text-white rounded-2xl py-4 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              Iniciar diagnóstico
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pergunta */}
        {perguntaAtual && (
          <div className="space-y-4">
            <p className="text-lg font-light text-slate-900 leading-snug mb-6">{perguntaAtual.texto}</p>
            {perguntaAtual.opcoes.map((opcao, idx) => (
              <button
                key={idx}
                onClick={() => responder(idx)}
                className="w-full text-left border border-slate-100 rounded-2xl px-5 py-4 hover:border-slate-300 hover:bg-slate-50 transition-all group flex items-center justify-between"
              >
                <span className="text-sm font-light text-slate-800">{opcao.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors flex-shrink-0" />
              </button>
            ))}

            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-light flex items-center gap-1 pt-2">
                <ChevronLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            )}
          </div>
        )}

        {/* Resultado */}
        {isResultado && (
          <div className="space-y-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed">
              Com base nas suas respostas, esta é a ordem de prioridade recomendada para o seu negócio:
            </p>

            <div className="space-y-3">
              {prioridades.map((p, i) => (
                <div key={p.key} className={`border ${p.border} ${p.bg} rounded-2xl px-5 py-4 flex items-center gap-4`}>
                  <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-sm font-semibold text-slate-700">{i + 1}º</span>
                  </div>
                  <p.icon className={`w-4 h-4 ${p.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{p.label}</p>
                    <p className="text-[10px] text-slate-500 font-light mt-0.5">Score: {p.score} pontos</p>
                  </div>
                  {i === 0 && (
                    <span className="text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-full font-medium flex-shrink-0">Prioridade</span>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-[#0d1117] rounded-2xl px-5 py-5">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-medium mb-2">Recomendação</p>
              <p className="text-white/80 text-sm font-light leading-relaxed">
                Comece pelo checklist de <strong className="text-white font-medium">{prioridades[0]?.label}</strong>.
                Foque nos itens de alto impacto primeiro para ver resultados mais rápidos.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                to={createPageUrl("ClientPortalEcommerceChecklist")}
                className="w-full bg-slate-900 text-white rounded-2xl py-4 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
              >
                Ver checklist priorizado
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => { setStep(0); setRespostas({}); }}
                className="w-full border border-slate-100 text-slate-500 rounded-2xl py-3.5 text-sm font-light hover:border-slate-300 transition-colors"
              >
                Refazer diagnóstico
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}