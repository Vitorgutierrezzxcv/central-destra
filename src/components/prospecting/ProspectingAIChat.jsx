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
    <Card className="border-[#EAEAEA]">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardTitle className="text-lg font-semibold text-[#131A20] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Assistente de Prospecção IA
        </CardTitle>
        <p className="text-sm text-[#456C8D]">
          Análise inteligente das suas métricas em tempo real
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user" 
                    ? "bg-blue-500" 
                    : "bg-gradient-to-br from-purple-500 to-blue-500"
                }`}>
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
                  <div className={`inline-block max-w-[85%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-[#EAEAEA] text-[#131A20]"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#EAEAEA] rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#456C8D]" />
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-3 space-y-2">
            <p className="text-xs text-[#456C8D] font-medium">Perguntas rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(question)}
                  className="text-xs h-auto py-1.5 px-3 border-[#EAEAEA] hover:bg-purple-50 hover:border-purple-300"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-[#EAEAEA]">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              className="flex-1 border-[#EAEAEA] focus:border-purple-400"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}