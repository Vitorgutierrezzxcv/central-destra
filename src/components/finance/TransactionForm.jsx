import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

const categoryMacroLabels = {
  faturamento_bruto: "Faturamento Bruto",
  imposto_faturamento: "Imposto sobre Faturamento",
  deducoes_cancelamentos: "Deduções e Cancelamentos",
  cmv: "CMV (Custo Mercadoria/Serviço)",
  despesa_variavel: "Despesa Variável",
  despesa_fixa: "Despesa Fixa",
  folha_pagamento: "Folha de Pagamento",
  resultado_financeiro: "Resultado Financeiro",
  imposto_lucro: "Imposto sobre Lucro"
};

const typeLabels = {
  income: "Receita",
  expense: "Despesa",
  financial_income: "Receita Financeira",
  financial_expense: "Despesa Financeira"
};

const paymentMethodLabels = {
  cash: "Dinheiro",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  bank_transfer: "Transferência Bancária",
  pix: "PIX",
  boleto: "Boleto",
  check: "Cheque"
};

export default function TransactionForm({ transaction, defaultType, companies, projects, onSubmit, onCancel, isLoading }) {
  const today = new Date().toISOString().split('T')[0];
  const currentMonthRef = format(new Date(), "yyyy-MM");

  const [currentTransaction, setCurrentTransaction] = useState(transaction || {
    type: defaultType || "income",
    category_macro: "",
    category_detail: "",
    amount: "",
    date: today,
    month_reference: currentMonthRef,
    description: "",
    payment_method: "pix",
    status: "completed",
    payment_date: "",
    linked_to_sale: false,
    company_id: "",
    project_id: "",
    recurring: false,
    notes: ""
  });

  // Auto-update month_reference when date changes
  useEffect(() => {
    if (currentTransaction.date) {
      const monthRef = currentTransaction.date.substring(0, 7);
      if (monthRef !== currentTransaction.month_reference) {
        setCurrentTransaction(prev => ({ ...prev, month_reference: monthRef }));
      }
    }
  }, [currentTransaction.date]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentTransaction.amount && currentTransaction.category_macro) {
      const dataToSubmit = {
        ...currentTransaction,
        amount: parseFloat(currentTransaction.amount),
        company_id: currentTransaction.company_id || null,
        project_id: currentTransaction.project_id || null
      };
      onSubmit(dataToSubmit);
    }
  };

  // Filter category_macro based on type
  const getAvailableCategories = () => {
    const type = currentTransaction.type;
    if (type === 'income') {
      return ['faturamento_bruto'];
    } else if (type === 'expense') {
      return ['imposto_faturamento', 'deducoes_cancelamentos', 'cmv', 'despesa_variavel', 'despesa_fixa', 'folha_pagamento', 'imposto_lucro'];
    } else if (type === 'financial_income' || type === 'financial_expense') {
      return ['resultado_financeiro'];
    }
    return Object.keys(categoryMacroLabels);
  };

  const availableCategories = getAvailableCategories();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl p-4 md:p-6 mb-6 md:mb-8 border border-[#EAEAEA]"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-[#131A20]">
          {transaction ? 'Editar Lançamento' : 'Novo Lançamento'}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="hover:bg-[#EAEAEA]"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">Tipo *</Label>
            <Select
              value={currentTransaction.type}
              onValueChange={(value) => setCurrentTransaction({...currentTransaction, type: value, category_macro: ""})}
            >
              <SelectTrigger id="type" className="h-10 md:h-11 border-[#EAEAEA]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_macro" className="text-sm font-medium">Categoria DRE *</Label>
            <Select
              value={currentTransaction.category_macro}
              onValueChange={(value) => setCurrentTransaction({...currentTransaction, category_macro: value})}
            >
              <SelectTrigger id="category_macro" className="h-10 md:h-11 border-[#EAEAEA]">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{categoryMacroLabels[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_detail" className="text-sm font-medium">Categoria Detalhada</Label>
            <Input
              id="category_detail"
              placeholder="Ex: Taxa de Cartão, Tráfego..."
              value={currentTransaction.category_detail}
              onChange={(e) => setCurrentTransaction({...currentTransaction, category_detail: e.target.value})}
              className="h-10 md:h-11 border-[#EAEAEA]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">Valor (R$) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={currentTransaction.amount}
              onChange={(e) => setCurrentTransaction({...currentTransaction, amount: e.target.value})}
              required
              className="h-10 md:h-11 border-[#EAEAEA]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">Data *</Label>
            <Input
              id="date"
              type="date"
              value={currentTransaction.date}
              onChange={(e) => setCurrentTransaction({...currentTransaction, date: e.target.value})}
              required
              className="h-10 md:h-11 border-[#EAEAEA]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="month_reference" className="text-sm font-medium">Mês Referência</Label>
            <Input
              id="month_reference"
              type="month"
              value={currentTransaction.month_reference}
              onChange={(e) => setCurrentTransaction({...currentTransaction, month_reference: e.target.value})}
              className="h-10 md:h-11 border-[#EAEAEA]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method" className="text-sm font-medium">Forma de Pagamento</Label>
            <Select
              value={currentTransaction.payment_method}
              onValueChange={(value) => setCurrentTransaction({...currentTransaction, payment_method: value})}
            >
              <SelectTrigger id="payment_method" className="h-10 md:h-11 border-[#EAEAEA]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select
              value={currentTransaction.status}
              onValueChange={(value) => setCurrentTransaction({...currentTransaction, status: value})}
            >
              <SelectTrigger id="status" className="h-10 md:h-11 border-[#EAEAEA]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Pago</SelectItem>
                <SelectItem value="pending">Em Aberto</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date" className="text-sm font-medium">Data do Pagamento</Label>
            <Input
              id="payment_date"
              type="date"
              value={currentTransaction.payment_date}
              onChange={(e) => setCurrentTransaction({...currentTransaction, payment_date: e.target.value})}
              className="h-10 md:h-11 border-[#EAEAEA]"
            />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
            <Input
              id="description"
              placeholder="Breve descrição do lançamento"
              value={currentTransaction.description}
              onChange={(e) => setCurrentTransaction({...currentTransaction, description: e.target.value})}
              className="h-10 md:h-11 border-[#EAEAEA]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_id" className="text-sm font-medium">Empresa (Opcional)</Label>
            <Select
              value={currentTransaction.company_id}
              onValueChange={(value) => setCurrentTransaction({...currentTransaction, company_id: value})}
            >
              <SelectTrigger id="company_id" className="h-10 md:h-11 border-[#EAEAEA]">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Nenhuma</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_id" className="text-sm font-medium">Projeto (Opcional)</Label>
            <Select
              value={currentTransaction.project_id}
              onValueChange={(value) => setCurrentTransaction({...currentTransaction, project_id: value})}
            >
              <SelectTrigger id="project_id" className="h-10 md:h-11 border-[#EAEAEA]">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Nenhum</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
            <Input
              id="notes"
              placeholder="Observações..."
              value={currentTransaction.notes}
              onChange={(e) => setCurrentTransaction({...currentTransaction, notes: e.target.value})}
              className="h-10 md:h-11 border-[#EAEAEA]"
            />
          </div>

          <div className="flex items-center space-x-4 md:col-span-2 lg:col-span-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={currentTransaction.recurring}
                onCheckedChange={(checked) => setCurrentTransaction({...currentTransaction, recurring: checked})}
              />
              <label htmlFor="recurring" className="text-sm font-medium">
                Recorrente
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="linked_to_sale"
                checked={currentTransaction.linked_to_sale}
                onCheckedChange={(checked) => setCurrentTransaction({...currentTransaction, linked_to_sale: checked})}
              />
              <label htmlFor="linked_to_sale" className="text-sm font-medium">
                Vinculado à venda
              </label>
            </div>
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
            className={`w-full sm:w-auto h-10 md:h-11 text-white ${
              currentTransaction.type === 'income' || currentTransaction.type === 'financial_income'
                ? 'bg-[#131A20] hover:bg-[#456C8D]'
                : 'bg-[#6FA6FF] hover:bg-[#456C8D]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {transaction ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              <>
                {transaction ? 'Salvar' : 'Criar Lançamento'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}