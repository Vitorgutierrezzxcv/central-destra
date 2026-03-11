import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const ACCOUNT_TYPES = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "cash", label: "Caixa" },
  { value: "investment", label: "Investimento" },
  { value: "reserve", label: "Reserva" },
];

const CARD_COLORS = [
  { value: "from-slate-700 to-slate-900", label: "Cinza" },
  { value: "from-blue-600 to-blue-900", label: "Azul" },
  { value: "from-violet-600 to-violet-900", label: "Roxo" },
  { value: "from-emerald-600 to-emerald-900", label: "Verde" },
  { value: "from-rose-600 to-rose-900", label: "Vermelho" },
  { value: "from-amber-600 to-amber-900", label: "Dourado" },
];

function AccountForm({ account, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name: "", type: "checking", institution: "", current_balance: 0, is_active: true, notes: "",
    ...(account || {})
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{account ? "Editar Conta" : "Nova Conta"}</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave({ ...form, current_balance: parseFloat(form.current_balance) || 0 }); }} className="space-y-4 pt-2">
          <div>
            <Label className="text-xs mb-1 block">Nome *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Tipo</Label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Instituição</Label>
              <Input value={form.institution} onChange={e => set("institution", e.target.value)} placeholder="Ex: Nubank" />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Saldo Atual (R$)</Label>
            <Input type="number" step="0.01" value={form.current_balance} onChange={e => set("current_balance", e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CardForm({ card, accounts, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name: "", institution: "", holder_name: "", last_digits: "", limit_amount: 0,
    closing_day: 1, due_day: 10, linked_account_id: "", color: "from-slate-700 to-slate-900", is_active: true,
    ...(card || {})
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{card ? "Editar Cartão" : "Novo Cartão"}</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave({ ...form, limit_amount: parseFloat(form.limit_amount) || 0 }); }} className="space-y-4 pt-2">
          {/* Preview */}
          <div className={`bg-gradient-to-br ${form.color} rounded-xl p-5 text-white`}>
            <p className="font-bold text-lg">{form.name || "Nome do Cartão"}</p>
            <p className="text-sm opacity-70">{form.institution || "Banco"}</p>
            <p className="text-xl tracking-widest mt-3">•••• {form.last_digits || "0000"}</p>
            <p className="text-xs opacity-70 mt-2">{form.holder_name || "Titular"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Nome *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Banco</Label>
              <Input value={form.institution} onChange={e => set("institution", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Titular</Label>
              <Input value={form.holder_name} onChange={e => set("holder_name", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Últimos 4 dígitos</Label>
              <Input value={form.last_digits} maxLength={4} onChange={e => set("last_digits", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Limite (R$)</Label>
              <Input type="number" step="0.01" value={form.limit_amount} onChange={e => set("limit_amount", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Fechamento (dia)</Label>
              <Input type="number" min="1" max="31" value={form.closing_day} onChange={e => set("closing_day", parseInt(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Vencimento (dia)</Label>
              <Input type="number" min="1" max="31" value={form.due_day} onChange={e => set("due_day", parseInt(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Conta vinculada</Label>
              <Select value={form.linked_account_id} onValueChange={v => set("linked_account_id", v)}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhuma</SelectItem>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Cor</Label>
              <Select value={form.color} onValueChange={v => set("color", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CARD_COLORS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FinanceAccounts() {
  const [tab, setTab] = useState("accounts");
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const qc = useQueryClient();

  const { data: accounts = [] } = useQuery({ queryKey: ["financial_accounts"], queryFn: () => base44.entities.FinancialAccount.list() });
  const { data: cards = [] } = useQuery({ queryKey: ["financial_cards"], queryFn: () => base44.entities.FinancialCard.list() });

  const saveAccountMutation = useMutation({
    mutationFn: (d) => d.id ? base44.entities.FinancialAccount.update(d.id, d) : base44.entities.FinancialAccount.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_accounts"] }); setShowAccountForm(false); setEditingAccount(null); },
  });
  const deleteAccountMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialAccount.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial_accounts"] }),
  });
  const saveCardMutation = useMutation({
    mutationFn: (d) => d.id ? base44.entities.FinancialCard.update(d.id, d) : base44.entities.FinancialCard.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["financial_cards"] }); setShowCardForm(false); setEditingCard(null); },
  });
  const deleteCardMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialCard.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial_cards"] }),
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Contas & Cartões</h1>
            <p className="text-slate-500 text-sm">Gerencie suas contas bancárias e cartões</p>
          </div>
          <Button onClick={() => tab === "accounts" ? setShowAccountForm(true) : setShowCardForm(true)} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            {tab === "accounts" ? "Nova Conta" : "Novo Cartão"}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="accounts"><Wallet className="w-4 h-4 mr-1" />Contas ({accounts.length})</TabsTrigger>
            <TabsTrigger value="cards"><CreditCard className="w-4 h-4 mr-1" />Cartões ({cards.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400">
                <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhuma conta cadastrada.</p>
              </div>
            )}
            {accounts.map(a => (
              <Card key={a.id} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.institution || ACCOUNT_TYPES.find(t => t.value === a.type)?.label}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => { setEditingAccount(a); setShowAccountForm(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="w-7 h-7 text-red-400 hover:text-red-600" onClick={() => deleteAccountMutation.mutate(a.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className={`text-2xl font-bold mt-4 ${(a.current_balance || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {fmt(a.current_balance)}
                  </p>
                  <Badge className="mt-2 bg-slate-100 text-slate-600 border-none text-xs">
                    {ACCOUNT_TYPES.find(t => t.value === a.type)?.label || a.type}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="cards" className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Nenhum cartão cadastrado.</p>
              </div>
            )}
            {cards.map(c => (
              <div key={c.id} className="space-y-3">
                <div className={`bg-gradient-to-br ${c.color || "from-slate-700 to-slate-900"} rounded-xl p-5 text-white relative`}>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30" onClick={() => { setEditingCard(c); setShowCardForm(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30" onClick={() => deleteCardMutation.mutate(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-bold text-lg">{c.name}</p>
                  <p className="text-sm opacity-70">{c.institution}</p>
                  <p className="text-xl tracking-widest mt-3">•••• {c.last_digits || "0000"}</p>
                  <p className="text-xs opacity-70 mt-2">{c.holder_name}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-slate-400">Limite</p>
                    <p className="font-semibold text-slate-700">{fmt(c.limit_amount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Fecha dia</p>
                    <p className="font-semibold text-slate-700">{c.closing_day}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Vence dia</p>
                    <p className="font-semibold text-slate-700">{c.due_day}</p>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {showAccountForm && (
        <AccountForm
          account={editingAccount}
          onSave={d => saveAccountMutation.mutate(d)}
          onClose={() => { setShowAccountForm(false); setEditingAccount(null); }}
          saving={saveAccountMutation.isPending}
        />
      )}
      {showCardForm && (
        <CardForm
          card={editingCard}
          accounts={accounts}
          onSave={d => saveCardMutation.mutate(d)}
          onClose={() => { setShowCardForm(false); setEditingCard(null); }}
          saving={saveCardMutation.isPending}
        />
      )}
    </div>
  );
}