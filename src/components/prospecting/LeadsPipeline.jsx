import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Users, 
  MessageCircle, 
  Phone, 
  Calendar, 
  UserX, 
  Video, 
  FileText, 
  Trophy,
  XCircle,
  ChevronRight,
  Pencil,
  Trash2,
  Instagram,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const stages = [
  { key: "prospectado", label: "Prospectado", icon: Users, color: "bg-slate-500", description: "Lead identificado" },
  { key: "respondeu", label: "Respondeu", icon: MessageCircle, color: "bg-blue-500", description: "Respondeu mensagem" },
  { key: "whatsapp_coletado", label: "WhatsApp", icon: Phone, color: "bg-green-500", description: "WhatsApp coletado" },
  { key: "reuniao_marcada", label: "Reunião Marcada", icon: Calendar, color: "bg-orange-500", description: "Reunião agendada" },
  { key: "no_show", label: "No-Show", icon: UserX, color: "bg-red-400", description: "Não compareceu" },
  { key: "reuniao_realizada", label: "Reunião Realizada", icon: Video, color: "bg-purple-500", description: "Reunião feita" },
  { key: "proposta_enviada", label: "Proposta", icon: FileText, color: "bg-indigo-500", description: "Proposta enviada" },
  { key: "venda_fechada", label: "Venda Fechada", icon: Trophy, color: "bg-emerald-500", description: "Cliente!" },
  { key: "perdido", label: "Perdido", icon: XCircle, color: "bg-gray-400", description: "Lead perdido" },
];

const sourceLabels = {
  destra: "Perfil Destra",
  bernardo: "Perfil Bernardo",
  indicacao: "Indicação",
  linkedin: "LinkedIn",
  site: "Site",
  outro: "Outro"
};

export default function LeadsPipeline({ 
  leads, 
  users, 
  currentUser, 
  selectedSeller,
  onCreateLead, 
  onUpdateLead, 
  onDeleteLead,
  isLoading 
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    instagram: "",
    whatsapp: "",
    email: "",
    source: "destra",
    stage: "prospectado",
    next_action: "",
    next_action_date: "",
    seller_email: currentUser?.email || "",
    notes: "",
    potential_value: ""
  });

  const resetForm = () => {
    setFormData({
      name: "",
      instagram: "",
      whatsapp: "",
      email: "",
      source: "destra",
      stage: "prospectado",
      next_action: "",
      next_action_date: "",
      seller_email: currentUser?.email || "",
      notes: "",
      potential_value: ""
    });
    setEditingLead(null);
  };

  const handleOpenForm = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        name: lead.name || "",
        instagram: lead.instagram || "",
        whatsapp: lead.whatsapp || "",
        email: lead.email || "",
        source: lead.source || "instagram",
        stage: lead.stage || "prospectado",
        next_action: lead.next_action || "",
        next_action_date: lead.next_action_date || "",
        seller_email: lead.seller_email || currentUser?.email || "",
        notes: lead.notes || "",
        potential_value: lead.potential_value || ""
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      potential_value: formData.potential_value ? parseFloat(formData.potential_value) : null,
      last_contact_date: new Date().toISOString().split('T')[0]
    };

    if (editingLead) {
      onUpdateLead(editingLead.id, data);
    } else {
      onCreateLead(data);
    }
    setShowForm(false);
    resetForm();
  };

  const handleStageChange = (lead, newStage) => {
    onUpdateLead(lead.id, { 
      ...lead, 
      stage: newStage,
      last_contact_date: new Date().toISOString().split('T')[0]
    });
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.instagram?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
    const matchesSeller = selectedSeller === "all" || lead.seller_email === selectedSeller;
    return matchesSearch && matchesStage && matchesSeller;
  });

  // Count leads per stage
  const stageCounts = stages.reduce((acc, stage) => {
    acc[stage.key] = filteredLeads.filter(l => l.stage === stage.key).length;
    return acc;
  }, {});

  const totalLeads = filteredLeads.length;

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
            <ChevronRight className="w-5 h-5 text-purple-400" />
            Pipeline de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-center py-2">
            {stages.slice(0, -1).map((stage, idx) => {
              const Icon = stage.icon;
              const count = stageCounts[stage.key] || 0;
              return (
                <React.Fragment key={stage.key}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${stage.color} flex items-center justify-center mb-1`}>
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm md:text-base">{count}</span>
                    <span className="text-white/70 text-[10px] md:text-xs text-center max-w-[60px] md:max-w-[80px] leading-tight">
                      {stage.label}
                    </span>
                  </div>
                  {idx < stages.length - 2 && (
                    <ChevronRight className="w-4 h-4 text-white/30 hidden md:block" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="text-center mt-3">
            <span className="text-white/60 text-sm">Total: {totalLeads} leads</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou Instagram..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-slate-200"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full md:w-[200px] h-11 border-slate-200">
            <SelectValue placeholder="Filtrar por etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etapas</SelectItem>
            {stages.map(stage => (
              <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={() => handleOpenForm()}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 h-11"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Leads Table */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-3 md:p-4 font-semibold text-slate-700 min-w-[180px]">Lead</th>
                {stages.map(stage => {
                  const Icon = stage.icon;
                  return (
                    <th key={stage.key} className="text-center p-2 md:p-3 font-semibold text-slate-700 min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full ${stage.color} flex items-center justify-center`}>
                          <Icon className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        </div>
                        <span className="text-[10px] md:text-xs">{stage.label}</span>
                      </div>
                    </th>
                  );
                })}
                <th className="text-center p-2 md:p-3 font-semibold text-slate-700 min-w-[120px]">Próxima Ação</th>
                <th className="text-center p-2 md:p-3 font-semibold text-slate-700 min-w-[80px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={stages.length + 3} className="text-center py-12 text-slate-500">
                      Nenhum lead encontrado. Clique em "Novo Lead" para adicionar.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => {
                    const seller = users.find(u => u.email === lead.seller_email);
                    return (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-slate-100 hover:bg-slate-50/50"
                      >
                        <td className="p-3 md:p-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-sm md:text-base">{lead.name}</span>
                            {lead.instagram && (
                              <span className="text-xs text-blue-500 flex items-center gap-1">
                                <Instagram className="w-3 h-3" />
                                {lead.instagram}
                              </span>
                            )}
                            <span className="text-[10px] md:text-xs text-slate-400">
                              {seller?.full_name || lead.seller_email}
                            </span>
                          </div>
                        </td>
                        {stages.map(stage => {
                          const isCurrentStage = lead.stage === stage.key;
                          const stageIndex = stages.findIndex(s => s.key === stage.key);
                          const currentIndex = stages.findIndex(s => s.key === lead.stage);
                          const isPassed = stageIndex < currentIndex;
                          
                          return (
                            <td key={stage.key} className="text-center p-2">
                              <button
                                onClick={() => handleStageChange(lead, stage.key)}
                                className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center transition-all
                                  ${isCurrentStage 
                                    ? `${stage.color} border-transparent` 
                                    : isPassed 
                                      ? 'bg-green-100 border-green-500' 
                                      : 'bg-white border-slate-200 hover:border-slate-400'
                                  }`}
                              >
                                {isCurrentStage && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                                {isPassed && (
                                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td className="p-2 md:p-3 text-center">
                          <div className="flex flex-col items-center">
                            {lead.next_action ? (
                              <>
                                <span className="text-xs text-slate-700 max-w-[100px] truncate">{lead.next_action}</span>
                                {lead.next_action_date && (
                                  <Badge variant="outline" className="text-[10px] mt-1">
                                    {format(new Date(lead.next_action_date), "dd/MM", { locale: ptBR })}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 md:p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenForm(lead)}
                              className="h-7 w-7 text-slate-500 hover:text-blue-600"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteLead(lead.id)}
                              className="h-7 w-7 text-slate-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do lead"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@usuario"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sourceLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Etapa Atual</Label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendedor Responsável</Label>
                <Select value={formData.seller_email} onValueChange={(v) => setFormData({ ...formData, seller_email: v })}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Valor Potencial (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.potential_value}
                  onChange={(e) => setFormData({ ...formData, potential_value: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Próxima Ação</Label>
              <Input
                value={formData.next_action}
                onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                placeholder="Ex: Enviar mensagem de follow-up"
              />
            </div>
            <div className="space-y-2">
              <Label>Data da Próxima Ação</Label>
              <Input
                type="date"
                value={formData.next_action_date}
                onChange={(e) => setFormData({ ...formData, next_action_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações sobre o lead..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  editingLead ? 'Salvar' : 'Criar Lead'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}