import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Target,
  MessageSquare,
  Send,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const stageLabels = {
  prospecting: "Prospecção",
  qualification: "Qualificação",
  presentation: "Apresentação",
  negotiation: "Negociação",
  closing: "Fechamento",
  post_sale: "Pós-venda"
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta"
};

export default function OpportunityDetail({ opportunity, company, isOpen, onClose }) {
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['opportunity-messages', opportunity?.id],
    queryFn: () => base44.entities.OpportunityMessage.filter(
      { opportunity_id: opportunity.id },
      '-created_date'
    ),
    enabled: !!opportunity?.id && isOpen,
    initialData: [],
  });

  const createMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.OpportunityMessage.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-messages', opportunity?.id] });
      setNewMessage("");
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    createMessageMutation.mutate({
      opportunity_id: opportunity.id,
      message: newMessage.trim(),
      user_email: user?.email,
      user_name: user?.full_name || user?.email
    });
  };

  if (!opportunity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {opportunity.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="bg-slate-100 grid w-full grid-cols-2">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Histórico
              {messages.length > 0 && (
                <Badge className="ml-1 bg-blue-500">{messages.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4 pr-2">
              {/* Status */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Status
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-blue-100 text-blue-700">
                      {stageLabels[opportunity.stage]}
                    </Badge>
                    {opportunity.priority && (
                      <Badge className="bg-purple-100 text-purple-700">
                        {priorityLabels[opportunity.priority]}
                      </Badge>
                    )}
                    {opportunity.probability && (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {opportunity.probability}% de chance
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Empresa */}
              {(company || opportunity.company_name) && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Empresa
                    </h3>
                    <p className="text-slate-700">{company?.name || opportunity.company_name}</p>
                    {company?.segment && (
                      <p className="text-sm text-slate-500 mt-1">{company.segment}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Valor */}
              {opportunity.value && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Valor
                    </h3>
                    <p className="text-2xl font-bold text-emerald-600">
                      R$ {parseFloat(opportunity.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Contato */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contato
                  </h3>
                  <div className="space-y-2 text-sm">
                    {opportunity.contact_name && (
                      <p className="text-slate-700">{opportunity.contact_name}</p>
                    )}
                    {opportunity.contact_email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${opportunity.contact_email}`} className="hover:text-blue-600">
                          {opportunity.contact_email}
                        </a>
                      </div>
                    )}
                    {opportunity.contact_phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${opportunity.contact_phone}`} className="hover:text-blue-600">
                          {opportunity.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Datas */}
              {(opportunity.expected_close_date || opportunity.actual_close_date) && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Datas
                    </h3>
                    <div className="space-y-2 text-sm">
                      {opportunity.expected_close_date && (
                        <div>
                          <span className="text-slate-500">Fechamento esperado: </span>
                          <span className="text-slate-700 font-medium">
                            {format(new Date(opportunity.expected_close_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      {opportunity.actual_close_date && (
                        <div>
                          <span className="text-slate-500">Fechamento real: </span>
                          <span className="text-slate-700 font-medium">
                            {format(new Date(opportunity.actual_close_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Necessidades e Objeções */}
              {(opportunity.needs || opportunity.objections) && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {opportunity.needs && (
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-1 text-sm">Necessidades</h4>
                        <p className="text-sm text-slate-600">{opportunity.needs}</p>
                      </div>
                    )}
                    {opportunity.objections && (
                      <div>
                        <h4 className="font-semibold text-slate-700 mb-1 text-sm">Objeções</h4>
                        <p className="text-sm text-slate-600">{opportunity.objections}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Próximo Passo */}
              {opportunity.next_step && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-2">Próximos Passos</h3>
                    <p className="text-sm text-slate-700">{opportunity.next_step}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="text-center py-8 text-slate-500">
                      Carregando histórico...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">
                        Nenhuma mensagem ainda. Seja o primeiro a registrar uma atividade!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.slice().reverse().map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.user_email === user?.email ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.user_email === user?.email
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold ${
                                msg.user_email === user?.email ? 'text-blue-100' : 'text-slate-600'
                              }`}>
                                {msg.user_name || msg.user_email}
                              </span>
                              <span className={`text-xs ${
                                msg.user_email === user?.email ? 'text-blue-200' : 'text-slate-400'
                              }`}>
                                {format(new Date(msg.created_date), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t border-slate-200 p-3">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Registre o que foi feito com esse lead..."
                      className="flex-1"
                      disabled={createMessageMutation.isPending}
                    />
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || createMessageMutation.isPending}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}