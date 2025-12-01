import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Pencil, Wallet, X, Copy } from "lucide-react";
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

const fixedCategories = [
  "Aluguel",
  "Contador",
  "Internet",
  "Energia",
  "Água",
  "Softwares/Ferramentas",
  "Seguros",
  "Marketing Institucional",
  "Outros"
];

export default function FinanceFixedExpenses() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    category_detail: "",
    amount: "",
    is_recurring: true,
    notes: ""
  });
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['fixed-expenses', selectedMonth],
    queryFn: () => base44.entities.FixedExpense.filter({ month_reference: selectedMonth }),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FixedExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FixedExpense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FixedExpense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    setFormData({
      description: "",
      category_detail: "",
      amount: "",
      is_recurring: true,
      notes: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
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
      is_recurring: expense.is_recurring ?? true,
      notes: expense.notes || ""
    });
    setShowForm(true);
  };

  const handleCopyFromPreviousMonth = async () => {
    const prevMonth = format(subMonths(parseISO(selectedMonth + "-01"), 1), "yyyy-MM");
    const prevExpenses = await base44.entities.FixedExpense.filter({ month_reference: prevMonth });
    
    if (prevExpenses.length === 0) {
      alert("Não há gastos fixos no mês anterior para copiar.");
      return;
    }

    const newExpenses = prevExpenses.map(exp => ({
      month_reference: selectedMonth,
      description: exp.description,
      category_detail: exp.category_detail,
      amount: exp.amount,
      is_recurring: exp.is_recurring,
      notes: exp.notes
    }));

    await base44.entities.FixedExpense.bulkCreate(newExpenses);
    queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] });
  };

  const totalFixed = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

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
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#131A20]">Gastos Fixos</h1>
              <p className="text-sm text-[#456C8D]">Despesas fixas mensais</p>
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
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-6 bg-[#EAEAEA]/30 border-[#EAEAEA]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#456C8D] mb-1">Total Gastos Fixos</p>
                <p className="text-3xl font-bold text-[#131A20]">
                  R$ {totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyFromPreviousMonth}
                  className="border-[#6FA6FF] text-[#6FA6FF] hover:bg-[#6FA6FF]/10"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar do Mês Anterior
                </Button>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Gasto Fixo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Editar Gasto Fixo" : "Novo Gasto Fixo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Aluguel do escritório"
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
                    {fixedCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
                <Label className="cursor-pointer">Recorrente</Label>
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
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[#131A20]">{expense.description}</h3>
                      {expense.is_recurring && (
                        <span className="text-xs bg-[#6FA6FF]/10 text-[#6FA6FF] px-2 py-0.5 rounded-full">
                          Recorrente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#456C8D]">{expense.category_detail}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-[#131A20]">
                      R$ {expense.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(expense)}
                        className="text-[#456C8D] hover:text-[#6FA6FF]"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(expense.id)}
                        className="text-[#456C8D] hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#EAEAEA]/30 rounded-xl">
            <Wallet className="w-16 h-16 text-[#456C8D] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-[#131A20] mb-2">Nenhum gasto fixo</h3>
            <p className="text-[#456C8D] mb-4">Adicione seus gastos fixos mensais</p>
            <Button onClick={() => setShowForm(true)} className="bg-[#6FA6FF] hover:bg-[#456C8D]">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Gasto Fixo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}