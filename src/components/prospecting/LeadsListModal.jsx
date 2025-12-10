import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, Phone, Mail, Calendar, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const stageLabels = {
  prospectado: "Leads Prospectados",
  respondeu: "Leads que Responderam",
  whatsapp: "WhatsApps Coletados",
  reuniao_marcada: "Reuniões Marcadas",
  no_show: "No-Shows",
  reuniao_realizada: "Reuniões Realizadas",
  proposta_enviada: "Propostas Enviadas",
  segunda_reuniao_marcada: "2ª Reunião Marcada",
  venda_fechada: "Vendas Fechadas",
  perdido: "Leads Perdidos"
};

const sourceLabels = {
  destra: "Perfil Destra",
  bernardo: "Perfil Bernardo",
  indicacao: "Indicação",
  linkedin: "LinkedIn",
  site: "Site",
  outro: "Outro"
};

export default function LeadsListModal({ isOpen, onClose, leads, stage, users }) {
  if (!stage) return null;

  const stageOrder = ['prospectado', 'respondeu', 'whatsapp', 'reuniao_marcada', 'no_show', 'reuniao_realizada', 'proposta_enviada', 'segunda_reuniao_marcada', 'venda_fechada', 'perdido'];
  const stageIndex = stageOrder.indexOf(stage);

  // Filtra leads que passaram por esse estágio ou estão nele
  const filteredLeads = leads.filter(l => {
    if (!l.stage) return false;
    const leadStageIndex = stageOrder.indexOf(l.stage);
    
    // Para no-show, mostra apenas leads que estão nesse estágio
    if (stage === 'no_show') return l.stage === 'no_show';
    
    // Para prospectado, mostra todos exceto perdidos
    if (stage === 'prospectado') return l.stage !== 'perdido';
    
    // Para outros, mostra se passou pelo estágio e não está perdido
    return leadStageIndex >= stageIndex && l.stage !== 'perdido';
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {stageLabels[stage]} ({filteredLeads.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum lead neste estágio
            </div>
          ) : (
            filteredLeads.map(lead => {
              const seller = users?.find(u => u.email === lead.seller_email);
              
              return (
                <Card key={lead.id} className="border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg">{lead.name}</h3>
                        {lead.company_segment && (
                          <p className="text-sm text-slate-600">{lead.company_segment}</p>
                        )}
                      </div>
                      {lead.potential_value && (
                        <Badge className="bg-green-100 text-green-700 font-semibold">
                          R$ {lead.potential_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      {lead.instagram && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Instagram className="w-4 h-4 text-pink-500" />
                          {lead.instagram}
                        </div>
                      )}
                      {lead.whatsapp && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-green-600" />
                          {lead.whatsapp}
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4 text-blue-600" />
                          {lead.email}
                        </div>
                      )}
                      {lead.meeting_date && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          {format(parseISO(lead.meeting_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {seller?.full_name || lead.seller_email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {lead.source && (
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                            {sourceLabels[lead.source] || lead.source}
                          </Badge>
                        )}
                        {lead.last_contact_date && (
                          <span className="text-xs text-slate-500">
                            {format(parseISO(lead.last_contact_date), "dd/MM/yy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>

                    {lead.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-600 line-clamp-2">{lead.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}