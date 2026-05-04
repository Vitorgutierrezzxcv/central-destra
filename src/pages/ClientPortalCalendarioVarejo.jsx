import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Tag, Flame, Info } from "lucide-react";

const CATEGORIAS = {
  feriado:     { label: "Feriado Nacional",   color: "bg-red-100 text-red-700 border-red-200",     dot: "bg-red-500" },
  sazonal:     { label: "Data Sazonal",       color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  ecommerce:   { label: "E-commerce",         color: "bg-blue-100 text-blue-700 border-blue-200",   dot: "bg-blue-500" },
  varejo:      { label: "Varejo / Consumo",   color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  pagamento:   { label: "Pagamento",          color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

// Todas as datas relevantes para 2025 e 2026
const EVENTOS = [
  // JANEIRO
  { data: "2025-01-01", nome: "Ano Novo",                        cat: "feriado",   hot: false, dica: "Volume baixo. Bom para liquidações de estoque do Natal." },
  { data: "2025-01-06", nome: "Dia de Reis",                     cat: "sazonal",   hot: false, dica: "Final da temporada natalina. Última oportunidade para promoções de presentes." },
  { data: "2025-01-13", nome: "Dia do Frete Grátis",            cat: "ecommerce", hot: true,  dica: "Excelente para campanhas de frete grátis e recuperação de carrinhos abandonados." },
  { data: "2025-01-15", nome: "Recebimento do 13º (parcela)",   cat: "pagamento", hot: true,  dica: "Consumidores com poder de compra elevado. Aproveite para campanhas de alto ticket." },

  // FEVEREIRO
  { data: "2025-02-14", nome: "Dia dos Namorados (EUA)",        cat: "sazonal",   hot: false, dica: "Data relevante para nicho de moda, beleza e presentes. Inspire com gift guides." },
  { data: "2025-03-01", nome: "Início do Carnaval",             cat: "sazonal",   hot: false, dica: "Queda nas conversões. Adie grandes lançamentos. Bom para campanhas de awareness." },
  { data: "2025-03-04", nome: "Terça de Carnaval",              cat: "feriado",   hot: false, dica: "Tráfego no celular aumenta. Invista em campanhas sociais e awareness." },
  { data: "2025-03-05", nome: "Quarta-Feira de Cinzas",         cat: "feriado",   hot: false, dica: "Retomada gradual do tráfego e conversões." },

  // MARÇO
  { data: "2025-03-08", nome: "Dia da Mulher",                  cat: "sazonal",   hot: true,  dica: "Grande oportunidade para moda, beleza, acessórios e bem-estar. Crie campanhas emocionais." },
  { data: "2025-03-15", nome: "Dia do Consumidor",              cat: "ecommerce", hot: true,  dica: "O 'Black Friday' do primeiro semestre. Prepare promoções agressivas e comunique com antecedência." },
  { data: "2025-03-19", nome: "Dia de São José / Dia do Pai (alguns estados)", cat: "sazonal", hot: false, dica: "Relevante em algumas regiões. Foco em itens masculinos." },
  { data: "2025-04-17", nome: "Quinta-Feira Santa",             cat: "feriado",   hot: false, dica: "Início do feriado prolongado. Campanhas de páscoa a todo vapor." },
  { data: "2025-04-18", nome: "Sexta-Feira Santa",              cat: "feriado",   hot: false, dica: "Tráfego mobile alto. Ótimo para e-mail e push com ofertas temáticas de Páscoa." },
  { data: "2025-04-20", nome: "Páscoa",                         cat: "sazonal",   hot: true,  dica: "2ª data mais importante do varejo. Foco em chocolates, presentes, família e decoração." },
  { data: "2025-04-21", nome: "Tiradentes",                     cat: "feriado",   hot: false, dica: "Feriado prolongado com Páscoa. Mantenha campanhas ativas." },

  // MAIO
  { data: "2025-05-01", nome: "Dia do Trabalho",                cat: "feriado",   hot: false, dica: "Feriado nacional. Tráfego moderado, bom para liquidações de verão." },
  { data: "2025-05-11", nome: "Dia das Mães",                   cat: "sazonal",   hot: true,  dica: "Top 1 data do varejo brasileiro. Planeje campanhas com 3 semanas de antecedência." },

  // JUNHO
  { data: "2025-06-12", nome: "Dia dos Namorados",              cat: "sazonal",   hot: true,  dica: "Top 3 data do varejo. Foco em joias, perfumes, experiências e moda." },
  { data: "2025-06-15", nome: "Corpus Christi",                 cat: "feriado",   hot: false, dica: "Feriado com emenda comum. Aproveite para campanhas de Festa Junina." },
  { data: "2025-06-24", nome: "Festa Junina / São João",        cat: "sazonal",   hot: false, dica: "Sazonalidade regional forte no Nordeste. Relevante para alimentos, decoração e moda típica." },

  // JULHO
  { data: "2025-07-01", nome: "Início das Férias Escolares",    cat: "sazonal",   hot: false, dica: "Consumo de brinquedos, viagem e lazer aumenta. Boa janela para upsell." },
  { data: "2025-07-15", nome: "Amazon Prime Day (aprox.)",      cat: "ecommerce", hot: true,  dica: "Concorrência alta. Prepare contra-ofertas ou aproveite o aumento do tráfego geral." },

  // AGOSTO
  { data: "2025-08-11", nome: "Dia dos Pais",                   cat: "sazonal",   hot: true,  dica: "Top 4 data do varejo. Foco em eletrônicos, ferramentas, bebidas e experiências masculinas." },
  { data: "2025-08-15", nome: "Assunção de Nossa Senhora",      cat: "feriado",   hot: false, dica: "Feriado regional em alguns estados. Verifique público-alvo." },

  // SETEMBRO
  { data: "2025-09-07", nome: "Dia da Independência",           cat: "feriado",   hot: false, dica: "Feriado prolongado. Boa oportunidade para liquidações de inverno." },
  { data: "2025-09-22", nome: "Início da Primavera / Fashion Week", cat: "sazonal", hot: false, dica: "Lançamento de coleção primavera-verão. Foco em moda, beleza e decoração." },

  // OUTUBRO
  { data: "2025-10-02", nome: "Dia das Crianças",               cat: "sazonal",   hot: true,  dica: "Top 5 data do varejo. Brinquedos, roupas infantis e eletrônicos são destaque." },
  { data: "2025-10-12", nome: "Nossa Sra. Aparecida / Dia das Crianças (feriado)", cat: "feriado", hot: true, dica: "Feriado prolongado com Dia das Crianças. Duplo impacto no varejo infantil." },
  { data: "2025-10-15", nome: "Dia do Professor",               cat: "sazonal",   hot: false, dica: "Nicho específico para livros, eletrônicos e papelaria." },
  { data: "2025-10-28", nome: "Dia do Servidor Público",        cat: "feriado",   hot: false, dica: "Feriado em algumas cidades. Monitore impacto regional." },
  { data: "2025-10-31", nome: "Halloween",                      cat: "sazonal",   hot: false, dica: "Crescente no Brasil. Foco em fantasias, doces, decoração e entretenimento." },

  // NOVEMBRO
  { data: "2025-11-02", nome: "Finados",                        cat: "feriado",   hot: false, dica: "Feriado de baixo volume. Evite grandes campanhas." },
  { data: "2025-11-15", nome: "Proclamação da República",       cat: "feriado",   hot: false, dica: "Feriado próximo à Black Friday. Aproveite para aquecer a campanha." },
  { data: "2025-11-20", nome: "Consciência Negra",              cat: "feriado",   hot: false, dica: "Feriado nacional. Campanhas com responsabilidade social podem gerar engajamento." },
  { data: "2025-11-28", nome: "Black Friday",                   cat: "ecommerce", hot: true,  dica: "O maior dia do e-commerce. Planeje com 6 semanas de antecedência. Estoque, logística e anúncios." },
  { data: "2025-12-01", nome: "Cyber Monday",                   cat: "ecommerce", hot: true,  dica: "Foco em eletrônicos e produtos digitais. Aproveite o momentum da Black Friday." },

  // DEZEMBRO
  { data: "2025-12-08", nome: "Imaculada Conceição",            cat: "feriado",   hot: false, dica: "Feriado de transição para o Natal. Início intenso das campanhas natalinas." },
  { data: "2025-12-18", nome: "Último dia útil com entrega garantida antes do Natal", cat: "ecommerce", hot: true, dica: "Comunique o prazo limite para garantir entrega. Gera urgência real." },
  { data: "2025-12-25", nome: "Natal",                          cat: "feriado",   hot: true,  dica: "Maior período do varejo. Campanhas de brindes, presentes e decoração desde novembro." },
  { data: "2025-12-26", nome: "Pós-Natal (trocas e recompra)", cat: "ecommerce", hot: false, dica: "Alto volume de trocas e recompra com cartões de presente. Prepare seu fluxo." },
  { data: "2025-12-31", nome: "Réveillon",                      cat: "sazonal",   hot: false, dica: "Foco em moda festiva, bebidas e decoração para festa." },

  // 2026 - JANEIRO
  { data: "2026-01-01", nome: "Ano Novo 2026",                  cat: "feriado",   hot: false, dica: "Início de novo ciclo. Bom para liquidações e campanhas de 'novo ano, nova você'." },
  { data: "2026-01-13", nome: "Dia do Frete Grátis",           cat: "ecommerce", hot: true,  dica: "Excelente para campanhas de frete grátis e recuperação de carrinhos." },
  { data: "2026-02-16", nome: "Início do Carnaval 2026",        cat: "sazonal",   hot: false, dica: "Queda nas conversões. Evite grandes lançamentos." },
  { data: "2026-03-08", nome: "Dia da Mulher 2026",             cat: "sazonal",   hot: true,  dica: "Grande data para moda, beleza e bem-estar." },
  { data: "2026-03-15", nome: "Dia do Consumidor 2026",         cat: "ecommerce", hot: true,  dica: "Prepare promoções agressivas com antecedência." },
  { data: "2026-05-10", nome: "Dia das Mães 2026",              cat: "sazonal",   hot: true,  dica: "Top 1 data do varejo. Planeje com 3 semanas de antecedência." },
  { data: "2026-06-12", nome: "Dia dos Namorados 2026",         cat: "sazonal",   hot: true,  dica: "Top 3 data do varejo." },
  { data: "2026-08-09", nome: "Dia dos Pais 2026",              cat: "sazonal",   hot: true,  dica: "Top 4 data do varejo." },
  { data: "2026-10-11", nome: "Dia das Crianças 2026",          cat: "sazonal",   hot: true,  dica: "Top 5 data do varejo." },
  { data: "2026-11-27", nome: "Black Friday 2026",              cat: "ecommerce", hot: true,  dica: "Maior dia do e-commerce. Planeje com 6 semanas de antecedência." },
  { data: "2026-11-30", nome: "Cyber Monday 2026",              cat: "ecommerce", hot: true,  dica: "Foco em eletrônicos e produtos digitais." },
  { data: "2026-12-25", nome: "Natal 2026",                     cat: "feriado",   hot: true,  dica: "Maior período do varejo." },
];

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function getEventosDoMes(year, month) {
  return EVENTOS.filter(e => {
    const d = new Date(e.data + "T12:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  }).sort((a, b) => new Date(a.data) - new Date(b.data));
}

export default function ClientPortalCalendarioVarejo() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [filterCat, setFilterCat] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const eventos = useMemo(() => {
    const list = getEventosDoMes(year, month);
    if (filterCat === "all") return list;
    return list.filter(e => e.cat === filterCat);
  }, [year, month, filterCat]);

  const allEventos = useMemo(() => {
    if (filterCat === "all") return EVENTOS;
    return EVENTOS.filter(e => e.cat === filterCat);
  }, [filterCat]);

  // Próximos 3 eventos a partir de hoje
  const proximos = useMemo(() => {
    const todayStr = today.toISOString().slice(0, 10);
    return EVENTOS
      .filter(e => e.data >= todayStr)
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(0, 3);
  }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const formatData = (str) => {
    const d = new Date(str + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const diasNoMes = new Date(year, month + 1, 0).getDate();
  const primeiroDia = new Date(year, month, 1).getDay();

  // Dias com evento para o mini-calendário
  const diasComEvento = useMemo(() => {
    const set = new Set();
    getEventosDoMes(year, month).forEach(e => {
      set.add(new Date(e.data + "T12:00:00").getDate());
    });
    return set;
  }, [year, month]);

  const diasHot = useMemo(() => {
    const set = new Set();
    getEventosDoMes(year, month).filter(e => e.hot).forEach(e => {
      set.add(new Date(e.data + "T12:00:00").getDate());
    });
    return set;
  }, [year, month]);

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-5 md:px-8 pt-10 md:pt-12 pb-6">
        <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-3">E-commerce</p>
        <h1 className="text-5xl md:text-6xl font-extralight text-slate-900 tracking-tight leading-[1.1] mb-2">
          Calendário<br />do Varejo
        </h1>
        <p className="text-slate-400 font-light text-sm mt-2">Feriados, datas sazonais e oportunidades de venda</p>
      </div>

      {/* Próximas datas */}
      <div className="px-5 md:px-8 pb-6">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">Próximas datas</p>
        <div className="space-y-2">
          {proximos.map(e => {
            const cfg = CATEGORIAS[e.cat];
            return (
              <div key={e.data + e.nome} className={`flex items-center gap-3 border rounded-2xl px-4 py-3 ${cfg.color}`}>
                {e.hot && <Flame className="w-4 h-4 flex-shrink-0 text-orange-500" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{e.nome}</p>
                  <p className="text-[10px] font-light mt-0.5 opacity-70">{formatData(e.data)} · {cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda + filtro */}
      <div className="px-5 md:px-8 pb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCat("all")}
            className={`h-7 px-3 rounded-full text-[10px] font-medium border transition-all ${
              filterCat === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"
            }`}
          >
            Todas
          </button>
          {Object.entries(CATEGORIAS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterCat(filterCat === key ? "all" : key)}
              className={`h-7 px-3 rounded-full text-[10px] font-medium border transition-all ${
                filterCat === key ? `${cfg.color} border-current` : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navegação de mês */}
      <div className="px-5 md:px-8 pb-3 flex items-center justify-between">
        <button onClick={prevMonth} className="w-9 h-9 rounded-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <h2 className="text-base font-medium text-slate-900">
          {MESES[month]} {year}
        </h2>
        <button onClick={nextMonth} className="w-9 h-9 rounded-xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Mini calendário visual */}
      <div className="px-5 md:px-8 pb-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <div className="grid grid-cols-7 mb-2">
            {["D","S","T","Q","Q","S","S"].map((d, i) => (
              <div key={i} className="text-center text-[9px] text-slate-400 font-medium uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array(primeiroDia).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {Array(diasNoMes).fill(null).map((_, i) => {
              const dia = i + 1;
              const hasEvento = diasComEvento.has(dia);
              const isHot = diasHot.has(dia);
              const isToday = today.getDate() === dia && today.getMonth() === month && today.getFullYear() === year;
              return (
                <div
                  key={dia}
                  className={`flex flex-col items-center justify-center h-8 rounded-lg text-xs font-light relative transition-all
                    ${isToday ? "bg-slate-900 text-white" : hasEvento ? "bg-slate-50 text-slate-700" : "text-slate-400"}
                  `}
                >
                  {dia}
                  {hasEvento && !isToday && (
                    <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isHot ? "bg-orange-400" : "bg-slate-400"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de eventos do mês */}
      <div className="px-5 md:px-8 pb-32">
        {eventos.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-light">Nenhuma data neste mês para o filtro selecionado.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {eventos.map(e => {
              const cfg = CATEGORIAS[e.cat];
              const d = new Date(e.data + "T12:00:00");
              const isExpanded = expandedId === e.data + e.nome;
              return (
                <button
                  key={e.data + e.nome}
                  onClick={() => setExpandedId(isExpanded ? null : e.data + e.nome)}
                  className="w-full text-left bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Data */}
                    <div className="flex-shrink-0 w-10 text-center">
                      <p className="text-xl font-extralight text-slate-900 leading-none">{String(d.getDate()).padStart(2, "0")}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">
                        {d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                      </p>
                    </div>

                    <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${cfg.dot}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-900 leading-tight">{e.nome}</p>
                        {e.hot && <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border inline-block mt-1 ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <Info className={`w-4 h-4 flex-shrink-0 transition-colors ${isExpanded ? "text-slate-700" : "text-slate-300"}`} />
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-0">
                      <div className="bg-[#0d1117] rounded-xl px-4 py-3">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-1.5">Dica estratégica</p>
                        <p className="text-sm text-white/70 font-light leading-relaxed">{e.dica}</p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}