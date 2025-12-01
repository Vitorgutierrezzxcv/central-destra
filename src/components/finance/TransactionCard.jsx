import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Building2, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoryLabels = {
  sale: "Venda",
  service: "Serviço",
  investment: "Investimento",
  other_income: "Outra Entrada",
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
};

const paymentMethodLabels = {
  cash: "Dinheiro",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  bank_transfer: "Transferência Bancária",
  pix: "PIX",
  check: "Cheque"
};

const statusConfig = {
  completed: { label: "Concluído", color: "bg-[#131A20]/10 text-[#131A20] border-[#131A20]/20" },
  pending: { label: "Pendente", color: "bg-[#EAEAEA] text-[#456C8D] border-[#EAEAEA]" },
  cancelled: { label: "Cancelado", color: "bg-[#EAEAEA] text-[#456C8D] border-[#EAEAEA]" }
};

export default function TransactionCard({ transaction, companies, projects, onEdit, onDelete }) {
  const isIncome = transaction.type === 'income';
  const company = companies.find(c => c.id === transaction.company_id);
  const project = projects.find(p => p.id === transaction.project_id);
  const status = statusConfig[transaction.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={`border-l-4 ${isIncome ? 'border-[#131A20]' : 'border-[#6FA6FF]'} shadow-sm hover:shadow-md transition-all bg-white border border-[#EAEAEA]`}>
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className={`mt-1 ${isIncome ? 'text-[#131A20]' : 'text-[#6FA6FF]'} flex-shrink-0`}>
              {isIncome ? (
                <ArrowUpCircle className="w-6 h-6" />
              ) : (
                <ArrowDownCircle className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-[#131A20]">
                    {transaction.description || categoryLabels[transaction.category]}
                  </h3>
                  <p className="text-sm text-[#456C8D]">
                    {format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className={`text-2xl font-bold ${isIncome ? 'text-[#131A20]' : 'text-[#6FA6FF]'}`}>
                  {isIncome ? '+' : '-'} R$ {parseFloat(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center mb-3">
                <Badge variant="outline" className="bg-white border-[#EAEAEA] text-[#456C8D]">
                  {categoryLabels[transaction.category]}
                </Badge>
                
                <Badge variant="outline" className={`border ${status.color}`}>
                  {status.label}
                </Badge>

                <Badge variant="outline" className="bg-white border-[#EAEAEA] text-[#456C8D]">
                  {paymentMethodLabels[transaction.payment_method]}
                </Badge>

                {transaction.recurring && (
                  <Badge className="bg-[#6FA6FF]/10 text-[#6FA6FF] border-[#6FA6FF]/30">
                    Recorrente
                  </Badge>
                )}

                {company && (
                  <Badge variant="outline" className="bg-white border-[#EAEAEA] text-[#456C8D] flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {company.name}
                  </Badge>
                )}

                {project && (
                  <Badge variant="outline" className="bg-white border-[#EAEAEA] text-[#456C8D] flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" />
                    {project.name}
                  </Badge>
                )}
              </div>

              {transaction.notes && (
                <p className="text-sm text-[#456C8D] italic mb-2">
                  {transaction.notes}
                </p>
              )}
            </div>

            <div className="flex md:flex-col gap-1 flex-shrink-0">
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
        </CardContent>
      </Card>
    </motion.div>
  );
}