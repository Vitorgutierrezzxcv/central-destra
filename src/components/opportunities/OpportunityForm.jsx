import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const stageLabels = {
  prospecting: "Prospecção/Atração",
  qualification: "Qualificação",
  presentation: "Apresentação/Consideração",
  negotiation: "Negociação/Decisão",
  closing: "Fechamento",
  post_sale: "Pós-venda/Fidelização"
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta"
};

export default function OpportunityForm({ opportunity, companies, stages = [], onSubmit, onCancel, isLoading }) {
  const [currentOpportunity, setCurrentOpportunity] = useState(opportunity || {
    title: "",
    company_id: "",
    company_name: "",
    value: "",
    stage: "prospecting",
    status: "open",
    source: "",
    probability: 10,
    expected_close_date: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    needs: "",
    objections: "",
    next_step: "",
    assigned_to: "",
    priority: "medium"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentOpportunity.title.trim()) {
      const dataToSubmit = {
        ...currentOpportunity,
        value: currentOpportunity.value ? parseFloat(currentOpportunity.value) : null,
        probability: currentOpportunity.probability ? parseInt(currentOpportunity.probability) : 10
      };
      onSubmit(dataToSubmit);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 md:p-6 pb-0">
          <DialogTitle className="text-lg md:text-xl font-bold text-slate-900">
            {opportunity ? 'Editar Oportunidade' : 'Nova Oportunidade'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-100px)] px-4 md:px-6 pb-4 md:pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title" className="text-sm font-medium">Título da Oportunidade *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Venda de sistema para Empresa XYZ"
                  value={currentOpportunity.title}
                  onChange={(e) => setCurrentOpportunity({...currentOpportunity, title: e.target.value})}
                  required
                  className="h-10 border-slate-200 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_id" className="text-sm font-medium">Empresa (opcional)</Label>
                <Select
                  value={currentOpportunity.company_id}
                  onValueChange={(value) => setCurrentOpportunity({...currentOpportunity, company_id: value, company_name: ""})}
                >
                  <SelectTrigger id="company_id" className="h-10 border-slate-200 focus:border-emerald-500">
                    <SelectValue placeholder="Selecione se houver cadastro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma (nome manual)</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!currentOpportunity.company_id && (
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-sm font-medium">Nome da Empresa</Label>
                  <Input
                    id="company_name"
                    placeholder="Digite o nome da empresa"
                    value={currentOpportunity.company_name}
                    onChange={(e) => setCurrentOpportunity({...currentOpportunity, company_name: e.target.value})}
                    className="h-10 border-slate-200 focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="value" className="text-sm font-medium">Valor Estimado (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50000.00"
                  value={currentOpportunity.value}
                  onChange={(e) => setCurrentOpportunity({...currentOpportunity, value: e.target.value})}
                  className="h-10 border-slate-200 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage" className="text-sm font-medium">Etapa do Funil *</Label>
                <Select
                  value={currentOpportunity.stage}
                  onValueChange={(value) => setCurrentOpportunity({...currentOpportunity, stage: value})}
                >
                  <SelectTrigger id="stage" className="h-10 border-slate-200 focus:border-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.length > 0 ? (
                      stages.map((stage) => (
                        <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>
                      ))
                    ) : (
                      Object.entries(stageLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">Prioridade</Label>
                <Select
                  value={currentOpportunity.priority}
                  onValueChange={(value) => setCurrentOpportunity({...currentOpportunity, priority: value})}
                >
                  <SelectTrigger id="priority" className="h-10 border-slate-200 focus:border-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source" className="text-sm font-medium">Canal de Origem</Label>
                <Input
                  id="source"
                  placeholder="Ex: Indicação, Site, LinkedIn"
                  value={currentOpportunity.source}
                  onChange={(e) => setCurrentOpportunity({...currentOpportunity, source: e.target.value})}
                  className="h-10 border-slate-200 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="probability" className="text-sm font-medium">Probabilidade (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={currentOpportunity.probability}
                  onChange={(e) => setCurrentOpportunity({...currentOpportunity, probability: e.target.value})}
                  className="h-10 border-slate-200 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_close_date" className="text-sm font-medium">Data Prevista</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={currentOpportunity.expected_close_date}
                  onChange={(e) => setCurrentOpportunity({...currentOpportunity, expected_close_date: e.target.value})}
                  className="h-10 border-slate-200 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">Informações de Contato</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Nome do contato"
                    value={currentOpportunity.contact_name}
                    onChange={(e) => setCurrentOpportunity({...currentOpportunity, contact_name: e.target.value})}
                    className="h-10 border-slate-200 focus:border-emerald-500"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={currentOpportunity.contact_email}
                    onChange={(e) => setCurrentOpportunity({...currentOpportunity, contact_email: e.target.value})}
                    className="h-10 border-slate-200 focus:border-emerald-500"
                  />
                  <Input
                    type="tel"
                    placeholder="Telefone"
                    value={currentOpportunity.contact_phone}
                    onChange={(e) => setCurrentOpportunity({...currentOpportunity, contact_phone: e.target.value})}
                    className="h-10 border-slate-200 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="needs" className="text-sm font-medium">Necessidades Identificadas</Label>
                <Textarea
                  id="needs"
                  placeholder="Descreva as necessidades e dores do cliente..."
                  value={currentOpportunity.needs}
                  onChange={(e) => setCurrentOpportunity({...currentOpportunity, needs: e.target.value})}
                  className="min-h-[60px] resize-none border-slate-200 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="next_step" className="text-sm font-medium">Próxima Ação</Label>
                <Input
                  id="next_step"
                  placeholder="Ex: Agendar reunião de apresentação"
                  value={currentOpportunity.next_step}
                  onChange={(e) => setCurrentOpportunity({...currentOpportunity, next_step: e.target.value})}
                  className="h-10 border-slate-200 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sticky bottom-0 bg-white pb-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full sm:w-auto h-10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {opportunity ? 'Salvando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    {opportunity ? 'Salvar' : 'Criar Oportunidade'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}