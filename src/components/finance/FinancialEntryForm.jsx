import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORIES_EXPENSE = [
  "Pessoal / Equipe","Pró-labore","Contador / Jurídico","Aluguel / Estrutura",
  "Software / Ferramentas","Marketing / Mídia","Energia / Internet","Impostos",
  "Fornecedores","Equipamentos","Capacitação","Viagem","Outros"
];
const CATEGORIES_REVENUE = [
  "Serviços","Consultoria","Gestão de Tráfego","Branding","Conteúdo",
  "Mídia Paga","Social Selling","Pacote Mensal","Projeto Único","Outros"
];
const COST_CENTERS = [
  "Operação","Marketing","Vendas","Administrativo","Financeiro",
  "Branding","Conteúdo","Equipe","Software/Ferramentas","Estrutura","Impostos","Outros"
];
const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "bank_transfer", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
  { value: "cash", label: "Dinheiro" },
  { value: "check", label: "Cheque" },
];
const FREQUENCIES = [
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
  { value: "bimonthly", label: "Bimestral" },
  { value: "quarterly", label: "Trimestral" },
  { value: "semiannual", label: "Semestral" },
  { value: "annual", label: "Anual" },
];
const STATUS_OPTIONS = [
  { value: "forecast", label: "Previsto" },
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "received", label: "Recebido" },
  { value: "overdue", label: "Vencido" },
  { value: "cancelled", label: "Cancelado" },
];

export default function FinancialEntryForm({ entry, accounts, cards, companies, projects, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    type: "expense",
    description: "",
    amount: "",
    status: "pending",
    category: "",
    subcategory: "",
    cost_center: "",
    project_id: "",
    company_id: "",
    vendor: "",
    responsible: "",
    account_id: "",
    card_id: "",
    payment_method: "",
    competence_date: "",
    due_date: "",
    paid_at: "",
    is_recurring: false,
    recurrence_frequency: "monthly",
    recurrence_start: "",
    recurrence_end: "",
    is_installment: false,
    installment_total: 2,
    notes: "",
    ...(entry || {}),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isRevenue = form.type === "revenue";
  const categories = isRevenue ? CATEGORIES_REVENUE : CATEGORIES_EXPENSE;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount: parseFloat(form.amount) || 0 });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Tipo */}
          <div>
            <Label className="text-xs mb-2 block">Tipo</Label>
            <Tabs value={form.type} onValueChange={v => set("type", v)}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="expense">Despesa</TabsTrigger>
                <TabsTrigger value="revenue">Receita</TabsTrigger>
                <TabsTrigger value="transfer">Transferência</TabsTrigger>
                <TabsTrigger value="adjustment">Ajuste</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Descrição + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs mb-1 block">Descrição *</Label>
              <Input value={form.description} onChange={e => set("description", e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => set("amount", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Categoria + Centro de Custo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Categoria</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Subcategoria</Label>
              <Input value={form.subcategory} onChange={e => set("subcategory", e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Centro de Custo</Label>
              <Select value={form.cost_center} onValueChange={v => set("cost_center", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {COST_CENTERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Competência</Label>
              <Input type="date" value={form.competence_date} onChange={e => set("competence_date", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Vencimento</Label>
              <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">{isRevenue ? "Recebido em" : "Pago em"}</Label>
              <Input type="date" value={form.paid_at} onChange={e => set("paid_at", e.target.value)} />
            </div>
          </div>

          {/* Conta + Cartão + Forma Pgto */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Conta</Label>
              <Select value={form.account_id} onValueChange={v => set("account_id", v)}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhuma</SelectItem>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Cartão</Label>
              <Select value={form.card_id} onValueChange={v => set("card_id", v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {cards.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Forma de Pagamento</Label>
              <Select value={form.payment_method} onValueChange={v => set("payment_method", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Projeto + Cliente + Fornecedor */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Projeto</Label>
              <Select value={form.project_id} onValueChange={v => set("project_id", v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Cliente</Label>
              <Select value={form.company_id} onValueChange={v => set("company_id", v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Fornecedor</Label>
              <Input value={form.vendor} onChange={e => set("vendor", e.target.value)} placeholder="Nome do fornecedor" />
            </div>
          </div>

          {/* Recorrência */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Lançamento Recorrente</Label>
              <Switch checked={form.is_recurring} onCheckedChange={v => set("is_recurring", v)} />
            </div>
            {form.is_recurring && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <Label className="text-xs mb-1 block">Frequência</Label>
                  <Select value={form.recurrence_frequency} onValueChange={v => set("recurrence_frequency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Início</Label>
                  <Input type="date" value={form.recurrence_start} onChange={e => set("recurrence_start", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Fim (opcional)</Label>
                  <Input type="date" value={form.recurrence_end} onChange={e => set("recurrence_end", e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Parcelamento */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Lançamento Parcelado</Label>
              <Switch checked={form.is_installment} onCheckedChange={v => set("is_installment", v)} />
            </div>
            {form.is_installment && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <Label className="text-xs mb-1 block">Total de Parcelas</Label>
                  <Input
                    type="number" min="2" max="120"
                    value={form.installment_total}
                    onChange={e => set("installment_total", parseInt(e.target.value) || 2)}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Valor por Parcela</Label>
                  <Input
                    readOnly
                    value={form.amount && form.installment_total
                      ? (parseFloat(form.amount) / form.installment_total).toFixed(2)
                      : ""}
                    className="bg-slate-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <Label className="text-xs mb-1 block">Observações</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 min-w-28">
              {saving ? "Salvando..." : (entry ? "Salvar" : "Criar Lançamento")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}