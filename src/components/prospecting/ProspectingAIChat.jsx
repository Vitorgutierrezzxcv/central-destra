import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Sparkles, Loader2, Bot, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProspectingAIChat({ leads = [], dateRangeLabel }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Olá! Sou seu assistente de análise de prospecção. Posso te ajudar a analisar suas métricas, identificar gargalos no funil e sugerir estratégias. Como posso te ajudar?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateMetricsContext = () => {
    const stageOrder = ['prospectado', 'respondeu', 'whatsapp', 'reuniao_marcada', 'no_show', 'reuniao_realizada', 'proposta_enviada', 'segunda_reuniao_marcada', 'venda_fechada', 'perdido'];
    
    const getCountForStage = (stage) => {
      const stageIndex = stageOrder.indexOf(stage);
      return leads.filter(l => {
        if (!l.stage) return false;
        const leadStageIndex = stageOrder.indexOf(l.stage);
        if (stage === 'prospectado') return l.stage !== 'perdido';
        return leadStageIndex >= stageIndex && l.stage !== 'perdido';
      }).length;
    };

    const metrics = {
      periodo: dateRangeLabel,
      total_leads: leads.filter(l => l.stage !== 'perdido').length,
      prospectados: getCountForStage('prospectado'),
      responderam: getCountForStage('respondeu'),
      whatsapp: getCountForStage('whatsapp'),
      reunioes_marcadas: getCountForStage('reuniao_marcada'),
      reunioes_realizadas: getCountForStage('reuniao_realizada'),
      no_shows: leads.filter(l => l.stage === 'no_show').length,
      propostas_enviadas: getCountForStage('proposta_enviada'),
      vendas_fechadas: leads.filter(l => l.stage === 'venda_fechada').length,
      valor_total_vendas: leads.filter(l => l.stage === 'venda_fechada').reduce((sum, l) => sum + (l.potential_value || 0), 0),
      perdidos: leads.filter(l => l.stage === 'perdido').length,
      
      // Taxas de conversão
      taxa_resposta: leads.length > 0 ? ((getCountForStage('respondeu') / getCountForStage('prospectado')) * 100).toFixed(1) : 0,
      taxa_whatsapp: getCountForStage('respondeu') > 0 ? ((getCountForStage('whatsapp') / getCountForStage('respondeu')) * 100).toFixed(1) : 0,
      taxa_reuniao: getCountForStage('whatsapp') > 0 ? ((getCountForStage('reuniao_marcada') / getCountForStage('whatsapp')) * 100).toFixed(1) : 0,
      taxa_fechamento: getCountForStage('reuniao_realizada') > 0 ? ((leads.filter(l => l.stage === 'venda_fechada').length / getCountForStage('reuniao_realizada')) * 100).toFixed(1) : 0,
      taxa_no_show: getCountForStage('reuniao_marcada') > 0 ? ((leads.filter(l => l.stage === 'no_show').length / getCountForStage('reuniao_marcada')) * 100).toFixed(1) : 0,
    };

    return `
Análise de Prospecção (${metrics.periodo}):

FUNIL DE VENDAS:
- Total de Leads Ativos: ${metrics.total_leads}
- Prospectados: ${metrics.prospectados}
- Responderam: ${metrics.responderam} (${metrics.taxa_resposta}% taxa de resposta)
- WhatsApp Coletados: ${metrics.whatsapp} (${metrics.taxa_whatsapp}% de respostas → whatsapp)
- Reuniões Marcadas: ${metrics.reunioes_marcadas} (${metrics.taxa_reuniao}% de whatsapp → reunião)
- Reuniões Realizadas: ${metrics.reunioes_realizadas}
- No-Shows: ${metrics.no_shows} (${metrics.taxa_no_show}% taxa de no-show)
- Propostas Enviadas: ${metrics.propostas_enviadas}
- Vendas Fechadas: ${metrics.vendas_fechadas} (${metrics.taxa_fechamento}% taxa de fechamento)
- Valor Total em Vendas: R$ ${metrics.valor_total_vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Leads Perdidos: ${metrics.perdidos}

Com base nesses dados, analise e responda à pergunta do usuário de forma objetiva e acionável.
    `.trim();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const metricsContext = generateMetricsContext();
      const fullPrompt = `${metricsContext}

PERGUNTA DO USUÁRIO: ${userMessage}

Responda de forma concisa, prática e focada em ações. Use dados específicos das métricas apresentadas. Se identificar gargalos, sugira soluções específicas.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        add_context_from_internet: false,
      });

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "Qual o principal gargalo do meu funil?",
    "Como melhorar minha taxa de resposta?",
    "Estratégias para reduzir no-show",
    "Como aumentar a taxa de fechamento?"
  ];

  return (
    <Card className="border-[#EAEAEA] flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b border-[#EAEAEA] flex-shrink-0">
        <CardTitle className="text-base font-semibold text-[#131A20] flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          Assistente IA
        </CardTitle>
      </CardHeader>
      
      <div className="flex-1 overflow-y-auto">
        {/* Messages */}
        <div className="p-4 md:p-6 space-y-6">
          <AnimatePresence>
            {messages.map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 md:gap-4"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.role === "assistant" ? (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1 text-slate-900">
                    {message.role === "assistant" ? "Assistente" : "Você"}
                  </div>
                  <div className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 md:gap-4"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm mb-1 text-slate-900">Assistente</div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && !isLoading && (
          <div className="px-4 md:px-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(question)}
                  className="text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-sm text-slate-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 border-t border-[#EAEAEA] flex-shrink-0 bg-white">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Envie uma mensagem..."
              disabled={isLoading}
              className="w-full border-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 pr-10 resize-none rounded-xl"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-10 w-10 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}