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
    return `${day}/${month}/${year}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-[#EAEAEA] hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isIncome ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isIncome ? (
                  transaction.type === 'financial_income' 
                    ? <TrendingUp className="w-5 h-5 text-green-600" />
                    : <ArrowUpCircle className="w-5 h-5 text-green-600" />
                ) : (
                  transaction.type === 'financial_expense'
                    ? <TrendingDown className="w-5 h-5 text-red-600" />
                    : <ArrowDownCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-[#131A20] truncate">
                    {transaction.description || categoryMacroLabels[transaction.category_macro] || 'Lançamento'}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {categoryMacroLabels[transaction.category_macro]}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-[#456C8D]">
                  <span>{formatDate(transaction.date)}</span>
                  {transaction.month_reference && (
                    <span className="text-[#6FA6FF]">• Ref: {transaction.month_reference}</span>
                  )}
                  {transaction.category_detail && (
                    <span>• {transaction.category_detail}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={`text-xs ${status.color}`}>
                    {status.label}
                  </Badge>
                  {transaction.payment_method && (
                    <Badge variant="outline" className="text-xs">
                      {paymentMethodLabels[transaction.payment_method]}
                    </Badge>
                  )}
                  {company && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {company.name}
                    </Badge>
                  )}
                  {project && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <FolderKanban className="w-3 h-3" />
                      {project.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                {isIncome ? '+' : '-'} R$ {transaction.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(transaction)}
                  className="h-8 w-8 text-[#456C8D] hover:text-[#6FA6FF] hover:bg-[#6FA6FF]/10"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(transaction.id)}
                  className="h-8 w-8 text-[#456C8D] hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}