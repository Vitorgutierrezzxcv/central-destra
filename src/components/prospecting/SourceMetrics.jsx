import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Instagram, Users } from "lucide-react";

export default function SourceMetrics({ leads }) {
  const calculateSourceMetrics = (source) => {
    const sourceLeads = leads.filter(l => l.source === source);
    const total = sourceLeads.length;
    
    if (total === 0) return null;

    const prospectados = sourceLeads.filter(l => l.stage === 'prospectado' || 
      ['respondeu', 'whatsapp', 'reuniao_marcada', 'no_show', 'reuniao_realizada', 
       'proposta_enviada', 'segunda_reuniao_marcada', 'venda_fechada'].includes(l.stage)).length;
    
    const responderam = sourceLeads.filter(l => 
      ['respondeu', 'whatsapp', 'reuniao_marcada', 'no_show', 'reuniao_realizada', 
       'proposta_enviada', 'segunda_reuniao_marcada', 'venda_fechada'].includes(l.stage)).length;
    
    const whatsapp = sourceLeads.filter(l => 
      ['whatsapp', 'reuniao_marcada', 'no_show', 'reuniao_realizada', 
       'proposta_enviada', 'segunda_reuniao_marcada', 'venda_fechada'].includes(l.stage)).length;
    
    const reunioes = sourceLeads.filter(l => 
      ['reuniao_realizada', 'proposta_enviada', 'segunda_reuniao_marcada', 'venda_fechada'].includes(l.stage)).length;
    
    const vendas = sourceLeads.filter(l => l.stage === 'venda_fechada').length;
    const perdidos = sourceLeads.filter(l => l.stage === 'perdido').length;
    
    const valorVendas = sourceLeads
      .filter(l => l.stage === 'venda_fechada')
      .reduce((sum, l) => sum + (l.potential_value || 0), 0);

    const taxaResposta = prospectados > 0 ? (responderam / prospectados * 100) : 0;
    const taxaWhatsApp = responderam > 0 ? (whatsapp / responderam * 100) : 0;
    const taxaReuniao = whatsapp > 0 ? (reunioes / whatsapp * 100) : 0;
    const taxaConversao = prospectados > 0 ? (vendas / prospectados * 100) : 0;
    const ticketMedio = vendas > 0 ? valorVendas / vendas : 0;

    return {
      total,
      prospectados,
      responderam,
      whatsapp,
      reunioes,
      vendas,
      perdidos,
      valorVendas,
      taxaResposta,
      taxaWhatsApp,
      taxaReuniao,
      taxaConversao,
      ticketMedio
    };
  };

  const destra = calculateSourceMetrics('destra');
  const bernardo = calculateSourceMetrics('bernardo');

  if (!destra && !bernardo) {
    return null;
  }

  const compareMetric = (destraVal, bernardoVal) => {
    if (!destra || !bernardo) return 'neutral';
    if (destraVal > bernardoVal) return 'destra';
    if (bernardoVal > destraVal) return 'bernardo';
    return 'neutral';
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Instagram className="w-5 h-5 text-pink-500" />
            Performance por Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Perfil Destra */}
            {destra && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Perfil Destra</h3>
                    <p className="text-xs text-slate-600">{destra.total} leads prospectados</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <MetricRow 
                    label="Taxa de Resposta" 
                    value={`${destra.taxaResposta.toFixed(1)}%`}
                    winner={compareMetric(destra.taxaResposta, bernardo?.taxaResposta || 0) === 'destra'}
                  />
                  <MetricRow 
                    label="Taxa WhatsApp" 
                    value={`${destra.taxaWhatsApp.toFixed(1)}%`}
                    winner={compareMetric(destra.taxaWhatsApp, bernardo?.taxaWhatsApp || 0) === 'destra'}
                  />
                  <MetricRow 
                    label="Taxa Reunião" 
                    value={`${destra.taxaReuniao.toFixed(1)}%`}
                    winner={compareMetric(destra.taxaReuniao, bernardo?.taxaReuniao || 0) === 'destra'}
                  />
                  <MetricRow 
                    label="Taxa Conversão" 
                    value={`${destra.taxaConversao.toFixed(1)}%`}
                    winner={compareMetric(destra.taxaConversao, bernardo?.taxaConversao || 0) === 'destra'}
                  />
                  <MetricRow 
                    label="Ticket Médio" 
                    value={`R$ ${destra.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    winner={compareMetric(destra.ticketMedio, bernardo?.ticketMedio || 0) === 'destra'}
                  />
                  <MetricRow 
                    label="Total Vendas" 
                    value={`R$ ${destra.valorVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    winner={compareMetric(destra.valorVendas, bernardo?.valorVendas || 0) === 'destra'}
                    highlight
                  />
                </div>
              </div>
            )}

            {/* Perfil Bernardo */}
            {bernardo && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Perfil Bernardo</h3>
                    <p className="text-xs text-slate-600">{bernardo.total} leads prospectados</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <MetricRow 
                    label="Taxa de Resposta" 
                    value={`${bernardo.taxaResposta.toFixed(1)}%`}
                    winner={compareMetric(destra?.taxaResposta || 0, bernardo.taxaResposta) === 'bernardo'}
                  />
                  <MetricRow 
                    label="Taxa WhatsApp" 
                    value={`${bernardo.taxaWhatsApp.toFixed(1)}%`}
                    winner={compareMetric(destra?.taxaWhatsApp || 0, bernardo.taxaWhatsApp) === 'bernardo'}
                  />
                  <MetricRow 
                    label="Taxa Reunião" 
                    value={`${bernardo.taxaReuniao.toFixed(1)}%`}
                    winner={compareMetric(destra?.taxaReuniao || 0, bernardo.taxaReuniao) === 'bernardo'}
                  />
                  <MetricRow 
                    label="Taxa Conversão" 
                    value={`${bernardo.taxaConversao.toFixed(1)}%`}
                    winner={compareMetric(destra?.taxaConversao || 0, bernardo.taxaConversao) === 'bernardo'}
                  />
                  <MetricRow 
                    label="Ticket Médio" 
                    value={`R$ ${bernardo.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    winner={compareMetric(destra?.ticketMedio || 0, bernardo.ticketMedio) === 'bernardo'}
                  />
                  <MetricRow 
                    label="Total Vendas" 
                    value={`R$ ${bernardo.valorVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    winner={compareMetric(destra?.valorVendas || 0, bernardo.valorVendas) === 'bernardo'}
                    highlight
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricRow({ label, value, winner, highlight }) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${
      highlight ? 'bg-white border border-slate-200' : 'bg-white/50'
    }`}>
      <span className={`text-sm ${highlight ? 'font-semibold' : 'font-medium'} text-slate-700`}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${highlight ? 'font-bold text-lg' : 'font-semibold'} text-slate-900`}>
          {value}
        </span>
        {winner && (
          <TrendingUp className="w-4 h-4 text-green-600" />
        )}
      </div>
    </div>
  );
}