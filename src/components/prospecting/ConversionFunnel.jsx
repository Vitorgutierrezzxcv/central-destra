import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target } from "lucide-react";

// Benchmarks de referência (podem ser ajustados)
const BENCHMARKS = {
  leadToResponse: { min: 5, good: 10, great: 15 }, // % de leads que respondem
  responseToWhatsapp: { min: 30, good: 50, great: 70 }, // % de respostas que viram WhatsApp
  whatsappToMeeting: { min: 20, good: 35, great: 50 }, // % de WhatsApp que viram reunião
  meetingToSale: { min: 15, good: 25, great: 40 }, // % de reuniões que fecham
};

const getPerformanceLevel = (value, benchmark) => {
  if (value >= benchmark.great) return { level: 'great', color: 'text-green-600', bg: 'bg-green-100', label: 'Excelente' };
  if (value >= benchmark.good) return { level: 'good', color: 'text-blue-600', bg: 'bg-blue-100', label: 'Bom' };
  if (value >= benchmark.min) return { level: 'ok', color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Regular' };
  return { level: 'low', color: 'text-red-600', bg: 'bg-red-100', label: 'Atenção' };
};

export default function ConversionFunnel({ leads = [] }) {
  // Ordem dos estágios do funil
  const stageOrder = ['prospectado', 'respondeu', 'whatsapp', 'reuniao_marcada', 'no_show', 'reuniao_realizada', 'proposta_enviada', 'segunda_reuniao_marcada', 'venda_fechada', 'perdido'];
  
  // Calcula quantos leads passaram por cada estágio (mesma lógica do ProspectingMetricsCards)
  const calculateFromLeads = (stage) => {
    if (!leads || leads.length === 0) return 0;
    const stageIndex = stageOrder.indexOf(stage);
    
    return leads.filter(l => {
      if (!l.stage) return false;
      const leadStageIndex = stageOrder.indexOf(l.stage);
      
      // Para prospectado, conta todos exceto perdidos
      if (stage === 'prospectado') return l.stage !== 'perdido';
      
      // Para outros, conta se já passou pelo estágio (índice >= target) e não está perdido
      return leadStageIndex >= stageIndex && l.stage !== 'perdido';
    }).length;
  };

  // Calcular totais baseados nos leads
  const totals = {
    instagram_leads: calculateFromLeads('prospectado'),
    instagram_responses: calculateFromLeads('respondeu'),
    whatsapp_collected: calculateFromLeads('whatsapp'),
    meetings_scheduled: calculateFromLeads('reuniao_marcada'),
    meetings_held: calculateFromLeads('reuniao_realizada'),
    no_shows: leads.filter(l => l.stage === 'no_show').length,
    sales_count: leads.filter(l => l.stage === 'venda_fechada').length,
    sales_amount: leads.filter(l => l.stage === 'venda_fechada').reduce((sum, l) => sum + (l.potential_value || 0), 0),
  };

  // Calcular taxas de conversão
  const leadToResponse = totals.instagram_leads > 0 
    ? (totals.instagram_responses / totals.instagram_leads) * 100 
    : 0;

  const responseToWhatsapp = totals.instagram_responses > 0 
    ? (totals.whatsapp_collected / totals.instagram_responses) * 100 
    : 0;

  const whatsappToMeeting = totals.whatsapp_collected > 0 
    ? (totals.meetings_scheduled / totals.whatsapp_collected) * 100 
    : 0;

  // Conversão de reunião para venda (usando contagem real de vendas)
  const meetingToSale = totals.meetings_held > 0 
    ? (totals.sales_count / totals.meetings_held) * 100 
    : 0;

  // Taxa de no-show
  const noShowRate = totals.meetings_scheduled > 0 
    ? (totals.no_shows / totals.meetings_scheduled) * 100 
    : 0;

  // Taxa de conversão geral (do lead à venda)
  const overallConversion = totals.instagram_leads > 0 && totals.sales_count > 0
    ? (totals.sales_count / totals.instagram_leads) * 100
    : 0;

  const funnelSteps = [
    {
      key: 'leads',
      label: 'Leads Prospectados',
      shortLabel: 'Leads',
      value: totals.instagram_leads,
      rate: null,
      benchmark: null,
      icon: Target,
      color: 'bg-[#6FA6FF]',
    },
    {
      key: 'responses',
      label: 'Responderam',
      shortLabel: 'Respostas',
      value: totals.instagram_responses,
      rate: leadToResponse,
      benchmark: BENCHMARKS.leadToResponse,
      nextLabel: 'Taxa de Resposta',
      shortNextLabel: 'Resposta',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp Coletado',
      shortLabel: 'WhatsApp',
      value: totals.whatsapp_collected,
      rate: responseToWhatsapp,
      benchmark: BENCHMARKS.responseToWhatsapp,
      nextLabel: 'Resposta → WhatsApp',
      shortNextLabel: 'Resp→Wpp',
    },
    {
      key: 'meetings',
      label: 'Reuniões Marcadas',
      shortLabel: 'Marcadas',
      value: totals.meetings_scheduled,
      rate: whatsappToMeeting,
      benchmark: BENCHMARKS.whatsappToMeeting,
      nextLabel: 'WhatsApp → Reunião',
      shortNextLabel: 'Wpp→Reun',
    },
    {
      key: 'held',
      label: 'Reuniões Realizadas',
      shortLabel: 'Realizadas',
      value: totals.meetings_held,
      rate: totals.meetings_scheduled > 0 ? ((totals.meetings_held / totals.meetings_scheduled) * 100) : 0,
      benchmark: { min: 60, good: 75, great: 90 },
      nextLabel: 'Taxa de Comparecimento',
      shortNextLabel: 'Compar.',
    },
  ];

  return (
    <Card className="border-[#EAEAEA]">
      <CardHeader className="pb-2 px-3 md:px-6">
        <CardTitle className="text-base md:text-lg font-semibold text-[#131A20] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-[#6FA6FF]" />
          Funil de Conversão
        </CardTitle>
        <p className="text-xs md:text-sm text-[#456C8D]">
          Taxas de conversão em cada etapa
        </p>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 px-3 md:px-6">
        {/* Funil Visual */}
        <div className="space-y-1 md:space-y-2">
          {funnelSteps.map((step, index) => {
            const performance = step.benchmark ? getPerformanceLevel(step.rate, step.benchmark) : null;
            const widthPercent = 100 - (index * 10); // Diminui menos no mobile
            
            return (
              <div key={step.key}>
                {/* Barra do funil */}
                <div 
                  className="relative mx-auto transition-all"
                  style={{ width: `${widthPercent}%` }}
                >
                  <div className={`
                    py-2 md:py-3 px-2 md:px-4 rounded-lg
                    ${index === 0 ? 'bg-[#6FA6FF]' : 'bg-[#EAEAEA]'}
                  `}>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs md:text-sm font-medium truncate ${index === 0 ? 'text-white' : 'text-[#131A20]'}`}>
                        <span className="hidden sm:inline">{step.label}</span>
                        <span className="sm:hidden">{step.shortLabel}</span>
                      </span>
                      <span className={`text-sm md:text-lg font-bold flex-shrink-0 ${index === 0 ? 'text-white' : 'text-[#131A20]'}`}>
                        {step.value}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Taxa de conversão entre etapas */}
                {step.rate !== null && index > 0 && (
                  <div className="flex items-center justify-center my-1 md:my-2 gap-1 md:gap-2">
                    <ArrowDown className="w-3 h-3 md:w-4 md:h-4 text-[#456C8D]" />
                    <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center">
                      <span className="text-[10px] md:text-xs text-[#456C8D]">
                        <span className="hidden sm:inline">{step.nextLabel}:</span>
                        <span className="sm:hidden">{step.shortNextLabel}:</span>
                      </span>
                      <Badge className={`${performance?.bg} ${performance?.color} text-[10px] md:text-xs font-semibold px-1.5 md:px-2`}>
                        {step.rate.toFixed(1)}%
                      </Badge>
                      {performance && (
                        <span className={`text-[10px] md:text-xs ${performance.color} hidden xs:inline`}>
                          {performance.label}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Insights e Recomendações */}
        <div className="border-t border-[#EAEAEA] pt-3 md:pt-4 mt-3 md:mt-4">
          <h4 className="text-xs md:text-sm font-semibold text-[#131A20] mb-2 md:mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#6FA6FF]" />
            Diagnóstico do Funil
          </h4>
          <div className="space-y-2">
            {/* Análise de cada etapa */}
            {leadToResponse < BENCHMARKS.leadToResponse.min && totals.instagram_leads > 0 && (
              <InsightCard
                type="warning"
                title="Taxa de Resposta Baixa"
                message={`Apenas ${leadToResponse.toFixed(1)}% dos leads respondem. Melhore sua abordagem inicial ou qualifique melhor seus leads.`}
              />
            )}
            {leadToResponse >= BENCHMARKS.leadToResponse.great && (
              <InsightCard
                type="success"
                title="Ótima Taxa de Resposta!"
                message={`${leadToResponse.toFixed(1)}% dos leads respondem. Sua abordagem está funcionando bem.`}
              />
            )}

            {responseToWhatsapp < BENCHMARKS.responseToWhatsapp.min && totals.instagram_responses > 0 && (
              <InsightCard
                type="warning"
                title="Dificuldade em Coletar WhatsApp"
                message={`Apenas ${responseToWhatsapp.toFixed(1)}% passam o WhatsApp. Trabalhe melhor a construção de interesse antes de pedir o contato.`}
              />
            )}

            {whatsappToMeeting < BENCHMARKS.whatsappToMeeting.min && totals.whatsapp_collected > 0 && (
              <InsightCard
                type="warning"
                title="Baixa Conversão para Reunião"
                message={`Apenas ${whatsappToMeeting.toFixed(1)}% aceitam reunião. Melhore seu pitch no WhatsApp e seja mais assertivo na oferta de valor.`}
              />
            )}

            {noShowRate > 25 && totals.meetings_scheduled > 0 && (
              <InsightCard
                type="warning"
                title="Alto Índice de No-Show"
                message={`${noShowRate.toFixed(1)}% das reuniões não comparecem. Envie lembretes e confirme no dia anterior.`}
              />
            )}

            {noShowRate <= 10 && totals.meetings_scheduled > 5 && (
              <InsightCard
                type="success"
                title="Excelente Taxa de Comparecimento"
                message={`Apenas ${noShowRate.toFixed(1)}% de no-show. Suas confirmações estão funcionando!`}
              />
            )}

            {totals.instagram_leads === 0 && (
              <InsightCard
                type="info"
                title="Sem dados suficientes"
                message="Registre suas métricas diárias para ver a análise do funil."
              />
            )}
          </div>
        </div>

        {/* Resumo Geral */}
        {totals.instagram_leads > 0 && (
          <div className="bg-[#EAEAEA]/30 rounded-lg p-3 md:p-4">
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div className="text-center">
                <p className="text-[10px] md:text-xs text-[#456C8D] mb-0.5 md:mb-1">Conversão Geral</p>
                <p className="text-base md:text-xl font-bold text-[#131A20]">
                  {overallConversion.toFixed(2)}%
                </p>
                <p className="text-[10px] md:text-xs text-[#456C8D]">Lead → Venda</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] md:text-xs text-[#456C8D] mb-0.5 md:mb-1">Ticket Médio</p>
                <p className="text-base md:text-xl font-bold text-[#6FA6FF]">
                  R$ {totals.sales_count > 0 ? (totals.sales_amount / totals.sales_count).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '0'}
                </p>
                <p className="text-[10px] md:text-xs text-[#456C8D]">por venda</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InsightCard({ type, title, message }) {
  const config = {
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
    },
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
    },
    info: {
      icon: Target,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
    },
  };

  const { icon: Icon, bg, border, iconColor, titleColor } = config[type];

  return (
    <div className={`p-2 md:p-3 rounded-lg ${bg} border ${border}`}>
      <div className="flex items-start gap-1.5 md:gap-2">
        <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${iconColor} mt-0.5 flex-shrink-0`} />
        <div className="min-w-0">
          <p className={`text-xs md:text-sm font-medium ${titleColor}`}>{title}</p>
          <p className="text-[10px] md:text-xs text-gray-600 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}