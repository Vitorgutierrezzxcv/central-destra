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
import { Checkbox } from "@/components/ui/checkbox";

const categoryLabels = {
  income: {
    sale: "Venda",
    service: "Serviço",
    investment: "Investimento",
    other_income: "Outra Entrada"
  },
  expense: {
    transport: "Transporte",
    tax: "Imposto",
    tools: "Ferramentas",
    salary: "Salário",
    rent: "Aluguel",
    utilities: "Utilidades",
    marketing: "Marketing",
    supplies: "Suprimentos",
    maintenance: "Manutenção",
    insurance: "Seguro",
    professional_services: "Serviços Profissionais",
    other_expense: "Outra Saída"
  }
};

const paymentMethodLabels = {
  cash: "Dinheiro",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  bank_transfer: "Transferência Bancária",
  pix: "PIX",
  check: "Cheque"
};

export default function TransactionForm({ transaction, defaultType, companies, projects, onSubmit, onCancel, isLoading }) {
  const [currentTransaction, setCurrentTransaction] = useState(transaction || {
    type: defaultType || "income",
    category: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    payment_method: "pix",
    status: "completed",
    company_id: "",
    project_id: "",
    recurring: false,
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentTransaction.amount && currentTransaction.category) {
      const dataToSubmit = {
        ...currentTransaction,
        amount: parseFloat(currentTransaction.amount),
        company_id: currentTransaction.company_id || null,
        project_id: currentTransaction.project_id || null
      };
      onSubmit(dataToSubmit);
    }
  };

  const availableCategories = categoryLabels[currentTransaction.type] || {};

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">Tipo *</Label>
            <Select
              value={currentTransaction.type}
              onValueChange={(value) => setCurrentTransaction({...currentTransaction, type: value, category: ""})}
            >
              <SelectTrigger id="type" className="h-10 md:h-11 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Entrada</SelectItem>
                <SelectItem value="expense">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">Categoria *</Label>
            <Select
              value={currentTransaction.category}
              onValueChange={(value) => setCurrentTransaction({...currentTransaction, category: value})}
            >
              <SelectTrigger id="category" className="h-10 md:h-11 border-slate-200">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(availableCategories).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="payment_method" className="text-sm font-medium">Forma de Pagamento</Label>
            <Select
              value={currentTransaction.payment_method}
              onValueChange={(value) => setCurrentTransaction({...currentTransaction, payment_method: value})}
            >
              <SelectTrigger id="payment_method" className="h-10 md:h-11 border-slate-200">
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
              <SelectTrigger id="status" className="h-10 md:h-11 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
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
              <SelectTrigger id="company_id" className="h-10 md:h-11 border-slate-200">
                <SelectValue placeholder="Selecione uma empresa" />
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
              <SelectTrigger id="project_id" className="h-10 md:h-11 border-slate-200">
                <SelectValue placeholder="Selecione um projeto" />
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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações adicionais..."
              value={currentTransaction.notes}
              onChange={(e) => setCurrentTransaction({...currentTransaction, notes: e.target.value})}
              className="min-h-[80px] resize-none border-[#EAEAEA]"
            />
          </div>

          <div className="flex items-center space-x-2 md:col-span-2">
            <Checkbox
              id="recurring"
              checked={currentTransaction.recurring}
              onCheckedChange={(checked) => setCurrentTransaction({...currentTransaction, recurring: checked})}
            />
            <label
              htmlFor="recurring"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Lançamento recorrente
            </label>
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
              currentTransaction.type === 'income'
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