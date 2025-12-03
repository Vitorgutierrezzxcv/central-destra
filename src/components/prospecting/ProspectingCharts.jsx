import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#14b8a6', '#ef4444', '#6366f1', '#ec4899'];

export default function ProspectingCharts({ leads = [], goals, dateRange }) {
  // Ordem dos estágios do funil
  const stageOrder = ['prospectado', 'respondeu', 'whatsapp', 'reuniao_marcada', 'no_show', 'reuniao_realizada', 'proposta_enviada', 'segunda_reuniao_marcada', 'venda_fechada', 'perdido'];
  
  // Calcula quantos leads passaram por cada estágio
  const calculateFromLeads = (stage) => {
    if (!leads || leads.length === 0) return 0;
    const stageIndex = stageOrder.indexOf(stage);
    return leads.filter(l => {
      if (!l.stage) return false;
      const leadStageIndex = stageOrder.indexOf(l.stage);
      if (stage === 'prospectado') return true;
      return leadStageIndex >= stageIndex;
    }).length;
  };

  // Agrupa leads por data
  const leadsByDate = leads.reduce((acc, lead) => {
    const date = lead.last_contact_date || lead.created_date?.split('T')[0];
    if (!date) return acc;
    if (!acc[date]) acc[date] = [];
    acc[date].push(lead);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(leadsByDate).sort();

  // Prepare data for line chart (daily evolution)
  const dailyData = sortedDates.map(date => {
    const dateLeads = leadsByDate[date];
    return {
      date: format(parseISO(date), 'dd/MM', { locale: ptBR }),
      leads: dateLeads.length,
      responses: dateLeads.filter(l => stageOrder.indexOf(l.stage) >= stageOrder.indexOf('respondeu')).length,
      whatsapp: dateLeads.filter(l => stageOrder.indexOf(l.stage) >= stageOrder.indexOf('whatsapp')).length,
      meetings: dateLeads.filter(l => stageOrder.indexOf(l.stage) >= stageOrder.indexOf('reuniao_marcada')).length,
      held: dateLeads.filter(l => stageOrder.indexOf(l.stage) >= stageOrder.indexOf('reuniao_realizada')).length,
    };
  });

  // Prepare data for conversion funnel
  const totalLeads = calculateFromLeads('prospectado');
  const totalResponses = calculateFromLeads('respondeu');
  const totalWhatsapp = calculateFromLeads('whatsapp');
  const totalMeetings = calculateFromLeads('reuniao_marcada');
  const totalHeld = calculateFromLeads('reuniao_realizada');

  const funnelData = [
    { name: 'Leads', value: totalLeads, percentage: 100 },
    { name: 'Respostas', value: totalResponses, percentage: totalLeads > 0 ? (totalResponses / totalLeads * 100).toFixed(1) : 0 },
    { name: 'WhatsApp', value: totalWhatsapp, percentage: totalLeads > 0 ? (totalWhatsapp / totalLeads * 100).toFixed(1) : 0 },
    { name: 'Reuniões', value: totalMeetings, percentage: totalLeads > 0 ? (totalMeetings / totalLeads * 100).toFixed(1) : 0 },
    { name: 'Realizadas', value: totalHeld, percentage: totalLeads > 0 ? (totalHeld / totalLeads * 100).toFixed(1) : 0 },
  ];

  // Prepare data for follow-ups (propostas e segundas reuniões)
  const followUpData = sortedDates.map(date => {
    const dateLeads = leadsByDate[date];
    return {
      date: format(parseISO(date), 'dd/MM', { locale: ptBR }),
      sent: dateLeads.filter(l => stageOrder.indexOf(l.stage) >= stageOrder.indexOf('proposta_enviada')).length,
      responses: dateLeads.filter(l => stageOrder.indexOf(l.stage) >= stageOrder.indexOf('segunda_reuniao_marcada')).length,
    };
  });

  // Prepare data for sales evolution
  const salesData = sortedDates.map(date => {
    const dateLeads = leadsByDate[date];
    const salesLeads = dateLeads.filter(l => l.stage === 'venda_fechada');
    return {
      date: format(parseISO(date), 'dd/MM', { locale: ptBR }),
      sales: salesLeads.reduce((sum, l) => sum + (l.potential_value || 0), 0),
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Evolution Chart */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-none rounded-2xl col-span-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">Evolução Diária</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '12px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} name="Leads" />
              <Line type="monotone" dataKey="responses" stroke="#8b5cf6" strokeWidth={2} name="Respostas" />
              <Line type="monotone" dataKey="whatsapp" stroke="#10b981" strokeWidth={2} name="WhatsApp" />
              <Line type="monotone" dataKey="meetings" stroke="#f59e0b" strokeWidth={2} name="Reuniões" />
              <Line type="monotone" dataKey="held" stroke="#14b8a6" strokeWidth={2} name="Realizadas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                formatter={(value, name, props) => [
                  `${value} (${props.payload.percentage}%)`,
                  'Quantidade'
                ]}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Follow-ups Chart */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-none rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">Follow-ups</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={followUpData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '12px' }}
              />
              <Legend />
              <Bar dataKey="sent" fill="#6366f1" radius={[8, 8, 0, 0]} name="Enviados" />
              <Bar dataKey="responses" fill="#ec4899" radius={[8, 8, 0, 0]} name="Respondidos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sales Chart */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-none rounded-2xl col-span-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">Evolução de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Bar dataKey="sales" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Vendas (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}