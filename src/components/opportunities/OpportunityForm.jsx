import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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

const stages = [
  { value: "prospecting", label: "Prospecção/Atração" },
  { value: "qualification", label: "Qualificação" },
  { value: "presentation", label: "Apresentação/Consideração" },
  { value: "negotiation", label: "Negociação/Decisão" },
  { value: "closing", label: "Fechamento" },
  { value: "post_sale", label: "Pós-venda/Fidelização" }
];

const priorities = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" }
];

export default function OpportunityForm({ opportunity, companies, onSubmit, onCancel, isLoading }) {
  const [currentOpportunity, setCurrentOpportunity] = useState(opportunity || {
    title: "",
    company_id: "",
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

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentOpportunity.title.trim() && currentOpportunity.company_id) {
      const dataToSubmit = {
        ...currentOpportunity,
        value: currentOpportunity.value ? parseFloat(currentOpportunity.value) : null,
        probability: parseInt(currentOpportunity.probability)
      };
      onSubmit(dataToSubmit);
    }
  };

  const getUserDisplayName = (user) => {
    return user.display_name || user.full_name || user.email;
  };

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
            <Label htmlFor="title">Título da Oportunidade *</Label>
            <Input
              id="title"
              placeholder="Ex: Implementação de sistema"
              value={currentOpportunity.title}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, title: e.target.value})}
              required
              className="h-10 md:h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_id">Empresa *</Label>
            <Select
              value={currentOpportunity.company_id}
              onValueChange={(value) => setCurrentOpportunity({...currentOpportunity, company_id: value})}
              required
            >
              <SelectTrigger id="company_id" className="h-10 md:h-11">
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
            <Label htmlFor="value">Valor Estimado (R$)</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              placeholder="Ex: 50000.00"
              value={currentOpportunity.value}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, value: e.target.value})}
              className="h-10 md:h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Etapa do Funil *</Label>
            <Select
              value={currentOpportunity.stage}
              onValueChange={(value) => setCurrentOpportunity({...currentOpportunity, stage: value})}
            >
              <SelectTrigger id="stage" className="h-10 md:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={currentOpportunity.priority}
              onValueChange={(value) => setCurrentOpportunity({...currentOpportunity, priority: value})}
            >
              <SelectTrigger id="priority" className="h-10 md:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="probability">Probabilidade de Fechamento (%)</Label>
            <Input
              id="probability"
              type="number"
              min="0"
              max="100"
              value={currentOpportunity.probability}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, probability: e.target.value})}
              className="h-10 md:h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date">Data Esperada de Fechamento</Label>
            <Input
              id="expected_close_date"
              type="date"
              value={currentOpportunity.expected_close_date}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, expected_close_date: e.target.value})}
              className="h-10 md:h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Canal de Origem</Label>
            <Input
              id="source"
              placeholder="Ex: LinkedIn, Indicação, Site"
              value={currentOpportunity.source}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, source: e.target.value})}
              className="h-10 md:h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Responsável</Label>
            <Select
              value={currentOpportunity.assigned_to || ""}
              onValueChange={(value) => setCurrentOpportunity({...currentOpportunity, assigned_to: value})}
            >
              <SelectTrigger id="assigned_to" className="h-10 md:h-11">
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Nenhum</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.email}>
                    {getUserDisplayName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="contact_name">Nome do Contato</Label>
            <Input
              id="contact_name"
              placeholder="Nome do contato principal"
              value={currentOpportunity.contact_name}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, contact_name: e.target.value})}
              className="h-10 md:h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Email do Contato</Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="email@exemplo.com"
              value={currentOpportunity.contact_email}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, contact_email: e.target.value})}
              className="h-10 md:h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Telefone do Contato</Label>
            <Input
              id="contact_phone"
              type="tel"
              placeholder="(11) 98765-4321"
              value={currentOpportunity.contact_phone}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, contact_phone: e.target.value})}
              className="h-10 md:h-11"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="needs">Necessidades Identificadas</Label>
            <Textarea
              id="needs"
              placeholder="Descreva as necessidades do cliente..."
              value={currentOpportunity.needs}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, needs: e.target.value})}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="objections">Objeções Levantadas</Label>
            <Textarea
              id="objections"
              placeholder="Registre as objeções do cliente..."
              value={currentOpportunity.objections}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, objections: e.target.value})}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="next_step">Próxima Ação</Label>
            <Textarea
              id="next_step"
              placeholder="Descreva a próxima ação a ser realizada..."
              value={currentOpportunity.next_step}
              onChange={(e) => setCurrentOpportunity({...currentOpportunity, next_step: e.target.value})}
              className="min-h-[60px] resize-none"
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