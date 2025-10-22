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

export default function OpportunityForm({ opportunity, companies, onSubmit, onCancel, isLoading }) {
  const [currentOpportunity, setCurrentOpportunity] = useState(opportunity || {
    title: "",
    company_id: companies.length > 0 ? companies[0].id : "",
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
    if (currentOpportunity.title.trim() && currentOpportunity.company_id) {
      const dataToSubmit = {
        ...currentOpportunity,
        value: currentOpportunity.value ? parseFloat(currentOpportunity.value) : null,
        probability: currentOpportunity.probability ? parseInt(currentOpportunity.probability) : 10
      };
      onSubmit(dataToSubmit);
    }
  };

  if (companies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-slate-200"
      >
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Nenhuma empresa cadastrada
          </h3>
          <p className="text-slate-600 mb-6">
            Você precisa cadastrar uma empresa antes de criar oportunidades
          </p>
          <Button onClick={onCancel}>Entendi</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-slate-200"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-bold text-slate-900">
          {opportunity ? 'Editar Oportunidade' : 'Nova Oportunidade'}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title" className="text-sm font-medium">Título da Oportunidade *</Label>
            <Input
              id="title"
              placeholder="Ex: Venda de sistema para Empresa XYZ"
              value={currentOpportunity.title}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, title: e.target.value})}
              required
              className="h-10 md:h-11 border-slate-200 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_id" className="text-sm font-medium">Empresa *</Label>
            <Select
              value={currentOpportunity.company_id}
              onValueChange={(value) => setCurrentOpportunity({...currentOpportunity, company_id: value})}
            >
              <SelectTrigger id="company_id" className="h-10 md:h-11 border-slate-200 focus:border-emerald-500">
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value" className="text-sm font-medium">Valor Estimado (R$)</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              placeholder="Ex: 50000.00"
              value={currentOpportunity.value}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, value: e.target.value})}
              className="h-10 md:h-11 border-slate-200 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage" className="text-sm font-medium">Etapa do Funil *</Label>
            <Select
              value={currentOpportunity.stage}
              onValueChange={(value) => setCurrentOpportunity({...currentOpportunity, stage: value})}
            >
              <SelectTrigger id="stage" className="h-10 md:h-11 border-slate-200 focus:border-emerald-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stageLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium">Prioridade</Label>
            <Select
              value={currentOpportunity.priority}
              onValueChange={(value) => setCurrentOpportunity({...currentOpportunity, priority: value})}
            >
              <SelectTrigger id="priority" className="h-10 md:h-11 border-slate-200 focus:border-emerald-500">
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
              className="h-10 md:h-11 border-slate-200 focus:border-emerald-500"
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
              className="h-10 md:h-11 border-slate-200 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date" className="text-sm font-medium">Data Prevista de Fechamento</Label>
            <Input
              id="expected_close_date"
              type="date"
              value={currentOpportunity.expected_close_date}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, expected_close_date: e.target.value})}
              className="h-10 md:h-11 border-slate-200 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-medium">Informações de Contato</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Nome do contato"
                value={currentOpportunity.contact_name}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, contact_name: e.target.value})}
                className="h-10 md:h-11 border-slate-200 focus:border-emerald-500"
              />
              <Input
                type="email"
                placeholder="Email do contato"
                value={currentOpportunity.contact_email}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, contact_email: e.target.value})}
                className="h-10 md:h-11 border-slate-200 focus:border-emerald-500"
              />
              <Input
                type="tel"
                placeholder="Telefone"
                value={currentOpportunity.contact_phone}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, contact_phone: e.target.value})}
                className="h-10 md:h-11 border-slate-200 focus:border-emerald-500"
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
              className="min-h-[80px] resize-none border-slate-200 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="next_step" className="text-sm font-medium">Próxima Ação</Label>
            <Input
              id="next_step"
              placeholder="Ex: Agendar reunião de apresentação"
              value={currentOpportunity.next_step}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, next_step: e.target.value})}
              className="h-10 md:h-11 border-slate-200 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto h-10 md:h-11"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-10 md:h-11"
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
    </motion.div>
  );
}