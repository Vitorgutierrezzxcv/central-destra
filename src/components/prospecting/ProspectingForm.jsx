import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, X, Plus, Trash2, Instagram } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function ProspectingForm({ metric, onSubmit, onCancel, isLoading, currentUserEmail }) {
  // Fetch all users for seller selection
  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const [currentMetric, setCurrentMetric] = useState(metric || {
    date: new Date().toISOString().split('T')[0],
    seller_email: currentUserEmail || "",
    instagram_leads: 0,
    instagram_responses: 0,
    whatsapp_collected: 0,
    meetings_scheduled: 0,
    no_shows: 0,
    meetings_held: 0,
    follow_ups_sent: 0,
    follow_ups_responses: 0,
    sales_amount: 0,
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(currentMetric);
  };

  const fields = [
    { key: "instagram_leads", label: "Leads Prospectados (Instagram)", icon: "📱" },
    { key: "instagram_responses", label: "Respostas Recebidas", icon: "💬" },
    { key: "whatsapp_collected", label: "WhatsApps Coletados", icon: "📞" },
    { key: "meetings_scheduled", label: "Reuniões Marcadas", icon: "📅" },
    { key: "no_shows", label: "No-Shows", icon: "❌" },
    { key: "meetings_held", label: "Reuniões Realizadas", icon: "✅" },
    { key: "follow_ups_sent", label: "Follow-ups Enviados", icon: "📧" },
    { key: "follow_ups_responses", label: "Follow-ups Respondidos", icon: "✉️" },
    { key: "sales_amount", label: "Vendas (R$)", icon: "💰", type: "currency" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6 md:mb-8"
    >
      <Card className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-200">
        <CardHeader className="border-b border-slate-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl font-bold text-slate-900">
              {metric ? 'Editar Métricas' : 'Registrar Métricas do Dia'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller_email" className="text-sm font-medium">Vendedor *</Label>
                <Select
                  value={currentMetric.seller_email}
                  onValueChange={(value) => setCurrentMetric({ ...currentMetric, seller_email: value })}
                >
                  <SelectTrigger className="h-11 border-slate-200">
                    <SelectValue placeholder="Selecione o vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={currentMetric.date}
                  onChange={(e) => setCurrentMetric({ ...currentMetric, date: e.target.value })}
                  required
                  className="h-11 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm font-medium flex items-center gap-2">
                    <span>{field.icon}</span>
                    {field.label}
                  </Label>
                  <Input
                    id={field.key}
                    type="number"
                    step={field.type === "currency" ? "0.01" : "1"}
                    min="0"
                    value={currentMetric[field.key]}
                    onChange={(e) => setCurrentMetric({
                      ...currentMetric,
                      [field.key]: parseFloat(e.target.value) || 0
                    })}
                    className="h-11 border-slate-200"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre o dia..."
                value={currentMetric.notes}
                onChange={(e) => setCurrentMetric({ ...currentMetric, notes: e.target.value })}
                className="min-h-[100px] resize-none border-slate-200"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full sm:w-auto h-11"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 h-11"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {metric ? 'Salvando...' : 'Registrando...'}
                  </>
                ) : (
                  <>{metric ? 'Salvar' : 'Registrar Métricas'}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}