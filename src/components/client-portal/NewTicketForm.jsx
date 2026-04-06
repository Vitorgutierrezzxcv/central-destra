import React, { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const categories = [
  { value: "duvida",      label: "❓ Dúvida" },
  { value: "bug",         label: "🐛 Problema / Bug" },
  { value: "solicitacao", label: "📋 Solicitação" },
  { value: "entrega",     label: "📦 Entrega" },
  { value: "outro",       label: "💬 Outro" },
];

const priorities = [
  { value: "low",    label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high",   label: "Alta" },
  { value: "urgent", label: "🔴 Urgente" },
];

export default function NewTicketForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "duvida",
    priority: "medium",
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Novo Chamado</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-600">Título do chamado *</Label>
          <Input
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="Descreva brevemente o seu problema"
            className="border-slate-200"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Categoria</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger className="border-slate-200 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Prioridade</Label>
            <Select value={form.priority} onValueChange={v => set("priority", v)}>
              <SelectTrigger className="border-slate-200 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-600">Descrição detalhada</Label>
          <Textarea
            value={form.description}
            onChange={e => set("description", e.target.value)}
            placeholder="Descreva o problema com o máximo de detalhes possível..."
            className="border-slate-200 min-h-[100px] resize-none text-sm"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-slate-200">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !form.title.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Send className="w-3.5 h-3.5" />
            Abrir Chamado
          </Button>
        </div>
      </form>
    </div>
  );
}