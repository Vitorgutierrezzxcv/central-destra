import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Pencil, 
  Trash2,
  Building2,
  FolderKanban,
  TrendingUp,
  TrendingDown
} from "lucide-react";

const categoryMacroLabels = {
  faturamento_bruto: "Faturamento Bruto",
  imposto_faturamento: "Imp. Faturamento",
  deducoes_cancelamentos: "Deduções",
  cmv: "CMV",
  despesa_variavel: "Desp. Variável",
  despesa_fixa: "Desp. Fixa",
  folha_pagamento: "Folha",
  resultado_financeiro: "Resultado Fin.",
  imposto_lucro: "Imp. Lucro"
};

const paymentMethodLabels = {
  cash: "Dinheiro",
  credit_card: "Cartão Crédito",
  debit_card: "Cartão Débito",
  bank_transfer: "Transferência",
  pix: "PIX",
  boleto: "Boleto",
  check: "Cheque"
};

const statusConfig = {
  completed: { label: "Pago", color: "bg-green-100 text-green-700" },
  pending: { label: "Em Aberto", color: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" }
};

export default function TransactionCard({ transaction, companies, projects, onEdit, onDelete }) {
  const isIncome = transaction.type === 'income' || transaction.type === 'financial_income';
  const company = companies?.find(c => c.id === transaction.company_id);
  const project = projects?.find(p => p.id === transaction.project_id);
  const status = statusConfig[transaction.status] || statusConfig.completed;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-[#EAEAEA] hover:shadow-md transition-shadow">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isIncome ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {isIncome ? (
                    transaction.type === 'financial_income' 
                      ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      : <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  ) : (
                    transaction.type === 'financial_expense'
                      ? <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                      : <ArrowDownCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#131A20] text-sm md:text-base truncate">
                    {transaction.description || categoryMacroLabels[transaction.category_macro] || 'Lançamento'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#456C8D]">
                    <span>{formatDate(transaction.date)}</span>
                    {transaction.month_reference && (
                      <span className="text-[#6FA6FF]">• {transaction.month_reference}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(transaction)}
                  className="h-7 w-7 md:h-8 md:w-8 text-[#456C8D] hover:text-[#6FA6FF] hover:bg-[#6FA6FF]/10"
                >
                  <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(transaction.id)}
                  className="h-7 w-7 md:h-8 md:w-8 text-[#456C8D] hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Button>
              </div>
            </div>
            
            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {categoryMacroLabels[transaction.category_macro]}
              </Badge>
              <Badge className={`text-xs px-1.5 py-0.5 ${status.color}`}>
                {status.label}
              </Badge>
              {transaction.payment_method && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 hidden sm:inline-flex">
                  {paymentMethodLabels[transaction.payment_method]}
                </Badge>
              )}
            </div>
            
            {/* Value row */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EAEAEA]">
              <div className="flex items-center gap-2 flex-wrap text-xs text-[#456C8D]">
                {company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {company.name}
                  </span>
                )}
                {project && (
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" />
                    {project.name}
                  </span>
                )}
              </div>
              <span className={`text-base md:text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                {isIncome ? '+' : '-'} R$ {transaction.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}