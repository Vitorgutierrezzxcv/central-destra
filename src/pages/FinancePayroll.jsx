import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, Users, Copy } from "lucide-react";
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

export default function FinancePayroll() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    employee_name: "",
    position: "",
    gross_salary: "",
    charges: "",
    benefits: "",
    notes: ""
  });
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery({
    queryKey: ['payroll', selectedMonth],
    queryFn: () => base44.entities.PayrollEntry.filter({ month_reference: selectedMonth }),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PayrollEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PayrollEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PayrollEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData({
      employee_name: "",
      position: "",
      gross_salary: "",
      charges: "",
      benefits: "",
      notes: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const grossSalary = parseFloat(formData.gross_salary) || 0;
    const charges = parseFloat(formData.charges) || 0;
    const benefits = parseFloat(formData.benefits) || 0;
    
    const data = {
      ...formData,
      gross_salary: grossSalary,
      charges: charges,
      benefits: benefits,
      total_cost: grossSalary + charges + benefits,
      month_reference: selectedMonth
    };

    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      employee_name: entry.employee_name || "",
      position: entry.position || "",
      gross_salary: entry.gross_salary?.toString() || "",
      charges: entry.charges?.toString() || "",
      benefits: entry.benefits?.toString() || "",
      notes: entry.notes || ""
    });
    setShowForm(true);
  };

  const handleCopyFromPreviousMonth = async () => {
    const prevMonth = format(subMonths(parseISO(selectedMonth + "-01"), 1), "yyyy-MM");
    const prevEntries = await base44.entities.PayrollEntry.filter({ month_reference: prevMonth });
    
    if (prevEntries.length === 0) {
      alert("Não há folha de pagamento no mês anterior para copiar.");
      return;
    }

    const newEntries = prevEntries.map(entry => ({
      month_reference: selectedMonth,
      employee_name: entry.employee_name,
      position: entry.position,
      gross_salary: entry.gross_salary,
      charges: entry.charges,
      benefits: entry.benefits,
      total_cost: entry.total_cost,
      notes: entry.notes
    }));

    await base44.entities.PayrollEntry.bulkCreate(newEntries);
    queryClient.invalidateQueries({ queryKey: ['payroll'] });
  };

  const totalPayroll = entries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);
  const totalGross = entries.reduce((sum, entry) => sum + (entry.gross_salary || 0), 0);
  const totalCharges = entries.reduce((sum, entry) => sum + (entry.charges || 0), 0);
  const totalBenefits = entries.reduce((sum, entry) => sum + (entry.benefits || 0), 0);

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
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#131A20]">Folha de Pagamento</h1>
              <p className="text-sm text-[#456C8D]">Custos com pessoal por mês</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-[#EAEAEA]/30 border-[#EAEAEA]">
            <CardContent className="p-3">
              <p className="text-xs text-[#456C8D] mb-1">Total Folha</p>
              <p className="text-lg md:text-xl font-bold text-[#131A20] truncate">
                R$ {totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#EAEAEA]">
            <CardContent className="p-3">
              <p className="text-xs text-[#456C8D] mb-1">Salários</p>
              <p className="text-lg md:text-xl font-bold text-[#131A20] truncate">
                R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#EAEAEA]">
            <CardContent className="p-3">
              <p className="text-xs text-[#456C8D] mb-1">Encargos</p>
              <p className="text-lg md:text-xl font-bold text-[#131A20] truncate">
                R$ {totalCharges.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-[#EAEAEA]">
            <CardContent className="p-3">
              <p className="text-xs text-[#456C8D] mb-1">Benefícios</p>
              <p className="text-lg md:text-xl font-bold text-[#131A20] truncate">
                R$ {totalBenefits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <Button
            variant="outline"
            onClick={handleCopyFromPreviousMonth}
            className="border-[#6FA6FF] text-[#6FA6FF] hover:bg-[#6FA6FF]/10 text-sm h-10"
            size="sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Mês Anterior
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white text-sm h-10"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Colaborador
          </Button>
        </div>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Editar Colaborador" : "Novo Colaborador"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome do Colaborador</Label>
                <Input
                  value={formData.employee_name}
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ex: Desenvolvedor"
                />
              </div>
              <div>
                <Label>Salário Bruto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.gross_salary}
                  onChange={(e) => setFormData({ ...formData, gross_salary: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Encargos (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.charges}
                    onChange={(e) => setFormData({ ...formData, charges: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label>Benefícios (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
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
                  {editingEntry ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Entries List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#EAEAEA] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map(entry => (
              <Card key={entry.id} className="border-[#EAEAEA] hover:shadow-md transition-shadow">
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#131A20] text-sm md:text-base truncate">{entry.employee_name}</h3>
                        <p className="text-xs md:text-sm text-[#456C8D]">{entry.position}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(entry)}
                          className="text-[#456C8D] hover:text-[#6FA6FF] h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(entry.id)}
                          className="text-[#456C8D] hover:text-red-500 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#456C8D]">
                      <span>Sal: R$ {entry.gross_salary?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                      <span>Enc: R$ {entry.charges?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                      <span>Ben: R$ {entry.benefits?.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#EAEAEA]">
                      <span className="text-xs text-[#456C8D]">Custo Total</span>
                      <span className="text-base md:text-lg font-bold text-[#131A20]">
                        R$ {entry.total_cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#EAEAEA]/30 rounded-xl">
            <Users className="w-16 h-16 text-[#456C8D] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-[#131A20] mb-2">Nenhum colaborador</h3>
            <p className="text-[#456C8D] mb-4">Adicione os colaboradores da folha de pagamento</p>
            <Button onClick={() => setShowForm(true)} className="bg-[#6FA6FF] hover:bg-[#456C8D]">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Colaborador
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}