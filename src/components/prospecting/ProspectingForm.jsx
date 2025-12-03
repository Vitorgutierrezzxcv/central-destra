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
  const queryClient = useQueryClient();
  
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

  // Quick lead registration
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadSource, setNewLeadSource] = useState("destra");
  const [newLeadStage, setNewLeadStage] = useState("prospectado");
  const [todayLeads, setTodayLeads] = useState([]);

  const stageLabels = {
    prospectado: "Prospectado",
    respondeu: "Respondeu",
    whatsapp_coletado: "WhatsApp",
    reuniao_marcada: "Reunião Marcada",
  };

  const createLeadMutation = useMutation({
    mutationFn: (leadData) => base44.entities.ProspectLead.create(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect-leads'] });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id) => base44.entities.ProspectLead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect-leads'] });
    },
  });

  const handleAddLead = () => {
    if (!newLeadName.trim()) return;
    
    const isInstagram = newLeadName.startsWith("@");
    const leadData = {
      name: isInstagram ? newLeadName : newLeadName,
      instagram: isInstagram ? newLeadName : "",
      source: newLeadSource,
      stage: "prospectado",
      seller_email: currentMetric.seller_email || currentUserEmail,
      last_contact_date: currentMetric.date
    };

    createLeadMutation.mutate(leadData, {
      onSuccess: (createdLead) => {
        setTodayLeads([...todayLeads, { ...leadData, id: createdLead?.id, tempId: Date.now() }]);
        setNewLeadName("");
        // Update instagram_leads count
        setCurrentMetric(prev => ({
          ...prev,
          instagram_leads: prev.instagram_leads + 1
        }));
      }
    });
  };

  const handleRemoveLead = (lead) => {
    if (lead.id) {
      deleteLeadMutation.mutate(lead.id);
    }
    setTodayLeads(todayLeads.filter(l => (l.id || l.tempId) !== (lead.id || lead.tempId)));
    setCurrentMetric(prev => ({
      ...prev,
      instagram_leads: Math.max(0, prev.instagram_leads - 1)
    }));
  };

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

            {/* Quick Lead Registration */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
              <Label className="text-sm font-semibold text-slate-700 mb-3 block">
                📱 Cadastrar Leads Prospectados
              </Label>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <Input
                  placeholder="Nome ou @instagram"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLead())}
                  className="flex-1 h-10 border-slate-200 bg-white"
                />
                <Select value={newLeadSource} onValueChange={setNewLeadSource}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10 border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="destra">Perfil Destra</SelectItem>
                    <SelectItem value="bernardo">Perfil Bernardo</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  onClick={handleAddLead}
                  disabled={!newLeadName.trim() || createLeadMutation.isPending}
                  className="h-10 bg-blue-600 hover:bg-blue-700"
                >
                  {createLeadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {todayLeads.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {todayLeads.map((lead) => (
                    <Badge 
                      key={lead.id || lead.tempId} 
                      variant="secondary" 
                      className="pl-2 pr-1 py-1 bg-white border border-slate-200 text-slate-700"
                    >
                      {lead.instagram ? (
                        <Instagram className="w-3 h-3 mr-1 text-pink-500" />
                      ) : null}
                      <span className="text-xs">{lead.name}</span>
                      <span className="text-[10px] ml-1 text-slate-400">
                        ({lead.source === 'bernardo' ? 'B' : 'D'})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLead(lead)}
                        className="ml-1 hover:bg-slate-100 rounded p-0.5"
                      >
                        <X className="w-3 h-3 text-slate-400" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                {todayLeads.length} lead(s) cadastrado(s) hoje
              </p>
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