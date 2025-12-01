import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, TrendingDown } from "lucide-react";
import { format, subMonths, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const variableCategories = [
  "Taxa de Cartão",
  "Taxa Gateway",
  "Comissão",
  "Frete sobre Venda",
  "Tráfego Performance",
  "Afiliados",
  "Plataforma",
  "Outros"
];

export default function FinanceVariableExpenses() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    category_detail: "",
    amount: "",
    percentage_of_revenue: "",
    notes: ""
  });
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['variable-expenses', selectedMonth],
    queryFn: () => base44.entities.VariableExpense.filter({ month_reference: selectedMonth }),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VariableExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable-expenses'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VariableExpense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable-expenses'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VariableExpense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variable-expenses'] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    setFormData({
      description: "",
      category_detail: "",
      amount: "",
      percentage_of_revenue: "",
      notes: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      percentage_of_revenue: parseFloat(formData.percentage_of_revenue) || 0,
      month_reference: selectedMonth
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description || "",
      category_detail: expense.category_detail || "",
      amount: expense.amount?.toString() || "",
      percentage_of_revenue: expense.percentage_of_revenue?.toString() || "",
      notes: expense.notes || ""
    });
    setShowForm(true);
  };

  const totalVariable = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const months = [];
  for (let i = -6; i <= 6; i++) {
    const date = i === 0 ? new Date() : (i < 0 ? subMonths(new Date(), Math.abs(i)) : addMonths(new Date(), i));
    months.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: ptBR })
    });
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#6FA6FF] rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#131A20]">Gastos Variáveis</h1>
              <p className="text-sm text-[#456C8D]">Despesas variáveis mensais</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value} className="capitalize">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-6 bg-[#EAEAEA]/30 border-[#EAEAEA]">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-[#456C8D] mb-1">Total Gastos Variáveis</p>
              <p className="text-2xl md:text-3xl font-bold text-[#131A20]">
                R$ {totalVariable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Editar Gasto Variável" : "Novo Gasto Variável"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Taxa de cartão de crédito"
                  required
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={formData.category_detail}
                  onValueChange={(v) => setFormData({ ...formData, category_detail: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {variableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <Label>% sobre Faturamento</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.percentage_of_revenue}
                    onChange={(e) => setFormData({ ...formData, percentage_of_revenue: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#6FA6FF] hover:bg-[#456C8D]">
                  {editingExpense ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Expenses List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#EAEAEA] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : expenses.length > 0 ? (
          <div className="space-y-3">
            {expenses.map(expense => (
              <Card key={expense.id} className="border-[#EAEAEA] hover:shadow-md transition-shadow">
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#131A20] text-sm md:text-base truncate">{expense.description}</h3>
                      <p className="text-xs md:text-sm text-[#456C8D]">{expense.category_detail}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-left sm:text-right">
                        <span className="text-base md:text-lg font-bold text-[#131A20]">
                          R$ {expense.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {expense.percentage_of_revenue > 0 && (
                          <p className="text-xs text-[#456C8D]">{expense.percentage_of_revenue}% do fat.</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(expense)}
                          className="text-[#456C8D] hover:text-[#6FA6FF] h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(expense.id)}
                          className="text-[#456C8D] hover:text-red-500 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#EAEAEA]/30 rounded-xl">
            <TrendingDown className="w-16 h-16 text-[#456C8D] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-[#131A20] mb-2">Nenhum gasto variável</h3>
            <p className="text-[#456C8D] mb-4">Adicione seus gastos variáveis mensais</p>
            <Button onClick={() => setShowForm(true)} className="bg-[#6FA6FF] hover:bg-[#456C8D]">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Gasto Variável
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}