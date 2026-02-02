import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingDown } from "lucide-react";
import { format } from "date-fns";

const categoryLabels = {
  marketing: "Marketing",
  shipping: "Frete",
  packaging: "Embalagem",
  platform_fees: "Taxas de Plataforma",
  taxes: "Impostos",
  other: "Outros"
};

export default function PiermontExpenses() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    recurring: false
  });

  const queryClient = useQueryClient();

  const { data: expenses = [] } = useQuery({
    queryKey: ['ecommerce-expenses'],
    queryFn: () => base44.entities.EcommerceExpense.list('-expense_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EcommerceExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce-expenses'] });
      setShowForm(false);
      setFormData({ expense_date: format(new Date(), 'yyyy-MM-dd'), recurring: false });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-black pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black">Gastos</h1>
            <div className="text-sm text-gray-600 mt-1">Total: R$ {totalExpenses.toFixed(2)}</div>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-black hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Novo Gasto
          </Button>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {expenses.map(expense => (
            <Card key={expense.id} className="border-black">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-bold text-black">{expense.description}</div>
                    <div className="text-sm text-gray-600">
                      {categoryLabels[expense.category]} • {format(new Date(expense.expense_date), 'dd/MM/yyyy')}
                      {expense.recurring && <span className="ml-2">• Recorrente</span>}
                    </div>
                    {expense.notes && (
                      <div className="text-sm text-gray-500 mt-1">{expense.notes}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-black">R$ {expense.amount?.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="border-black">
            <DialogHeader>
              <DialogTitle className="text-black">Novo Gasto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-black">Descrição*</Label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="border-black"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Categoria*</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})} required>
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-black">Valor*</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    className="border-black"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-black">Data*</Label>
                <Input
                  type="date"
                  value={formData.expense_date || ''}
                  onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                  className="border-black"
                  required
                />
              </div>

              <div>
                <Label className="text-black">Observações</Label>
                <Input
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="border-black"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-black">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">
                  Criar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}