import React, { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  PhoneCall,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const stages = [
  { key: "prospectado", label: "Prospectado", icon: Users, color: "bg-slate-500", description: "Lead identificado" },
  { key: "respondeu", label: "Respondeu", icon: MessageCircle, color: "bg-blue-500", description: "Respondeu mensagem" },
  { key: "whatsapp", label: "WhatsApp", icon: Phone, color: "bg-green-500", description: "Foi pro WhatsApp" },
  { key: "reuniao_marcada", label: "Reunião Marcada", icon: Calendar, color: "bg-orange-500", description: "Reunião agendada" },
  { key: "no_show", label: "No-Show", icon: UserX, color: "bg-red-400", description: "Não compareceu" },
  { key: "reuniao_realizada", label: "1ª Reunião", icon: Video, color: "bg-purple-500", description: "Reunião feita" },
  { key: "proposta_enviada", label: "Proposta", icon: FileText, color: "bg-indigo-500", description: "Proposta enviada" },
  { key: "segunda_reuniao_marcada", label: "2ª Reunião", icon: Calendar, color: "bg-cyan-500", description: "Segunda reunião" },
  { key: "venda_fechada", label: "Venda!", icon: Trophy, color: "bg-emerald-500", description: "Cliente!" },
  { key: "perdido", label: "Perdido", icon: XCircle, color: "bg-gray-400", description: "Lead perdido" },
];

const recommendationLabels = {
  aguardar: { label: "Aguardar Resposta", icon: Clock, color: "bg-slate-100 text-slate-700" },
  follow_up_instagram: { label: "Follow-up Instagram", icon: Instagram, color: "bg-pink-100 text-pink-700" },
  follow_up_whatsapp: { label: "Pedir WhatsApp", icon: Phone, color: "bg-green-100 text-green-700" },
  follow_up_whatsapp_msg: { label: "Follow-up WhatsApp", icon: Send, color: "bg-green-100 text-green-700" },
  ligar: { label: "Ligar", icon: PhoneCall, color: "bg-blue-100 text-blue-700" },
  montar_proposta: { label: "Montar Proposta", icon: FileText, color: "bg-indigo-100 text-indigo-700" },
  marcar_segunda_reuniao: { label: "Marcar 2ª Reunião", icon: Calendar, color: "bg-cyan-100 text-cyan-700" },
  follow_up_proposta: { label: "Follow-up Proposta", icon: Send, color: "bg-purple-100 text-purple-700" },
  ligar_proposta: { label: "Ligar (Proposta)", icon: PhoneCall, color: "bg-purple-100 text-purple-700" },
  ligar_no_show: { label: "Ligar (No-Show)", icon: PhoneCall, color: "bg-red-100 text-red-700" },
  nenhuma: { label: "Sem recomendação", icon: CheckCircle2, color: "bg-gray-100 text-gray-500" },
};

const sourceLabels = {
  destra: "Perfil Destra",
  bernardo: "Perfil Bernardo",
  indicacao: "Indicação",
  linkedin: "LinkedIn",
  site: "Site",
  outro: "Outro"
};

// Calcula recomendação baseada no estágio e tempo
const calculateRecommendation = (lead) => {
  // Usa last_stage_change, last_contact_date ou created_date como fallback
  const lastChangeStr = lead.last_stage_change || lead.last_contact_date || lead.created_date;
  
  let daysSinceChange = 0;
  if (lastChangeStr) {
    try {
      const lastChange = parseISO(lastChangeStr.split('T')[0]);
      daysSinceChange = differenceInDays(new Date(), lastChange);
    } catch (e) {
      daysSinceChange = 0;
    }
  }

  switch (lead.stage) {
    case "prospectado":
      if (daysSinceChange >= 1) return "follow_up_instagram";
      return "aguardar";
    
    case "respondeu":
      if (daysSinceChange >= 1) return "follow_up_instagram";
      return "aguardar";
    
    case "whatsapp":
      if (daysSinceChange >= 2) return "ligar";
      if (daysSinceChange >= 1) return "follow_up_whatsapp_msg";
      return "aguardar";
    
    case "reuniao_marcada":
      return "aguardar";
    
    case "no_show":
      return "ligar_no_show";
    
    case "reuniao_realizada":
      return "montar_proposta";
    
    case "proposta_enviada":
      if (daysSinceChange >= 3) return "ligar_proposta";
      if (daysSinceChange >= 1) return "follow_up_proposta";
      return "marcar_segunda_reuniao";
    
    case "segunda_reuniao_marcada":
      return "aguardar";
    
    case "venda_fechada":
    case "perdido":
      return "nenhuma";
    
    default:
      return "aguardar";
  }
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
  // Invalidar queries de métricas e metas quando houver mudanças
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    // Sempre que leads mudarem, invalidar todas as queries relacionadas
    queryClient.invalidateQueries({ queryKey: ['prospecting-goals'] });
    queryClient.invalidateQueries({ queryKey: ['prospecting-metrics'] });
  }, [leads, queryClient]);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [showOnlyWithRecommendation, setShowOnlyWithRecommendation] = useState(false);

  const queryClient = useQueryClient();

  // Mutation para criar oportunidade
  const createOpportunityMutation = useMutation({
    mutationFn: (data) => base44.entities.Opportunity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    }
  });

  // Mutation para atualizar oportunidade
  const updateOpportunityMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Opportunity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    }
  });

  // Mutation para criar histórico de mudança de fase
  const createStageHistoryMutation = useMutation({
    mutationFn: (data) => base44.entities.LeadStageHistory.create(data),
  });

  const [formData, setFormData] = useState({
    name: "",
    instagram: "",
    whatsapp: "",
    email: "",
    source: "destra",
    stage: "prospectado",
    seller_email: currentUser?.email || "",
    notes: "",
    potential_value: "",
    company_segment: "",
    meeting_date: ""
  });

  const resetForm = () => {
    setFormData({
      name: "",
      instagram: "",
      whatsapp: "",
      email: "",
      source: "destra",
      stage: "prospectado",
      seller_email: currentUser?.email || "",
      notes: "",
      potential_value: "",
      company_segment: "",
      meeting_date: ""
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
        source: lead.source || "destra",
        stage: lead.stage || "prospectado",
        seller_email: lead.seller_email || currentUser?.email || "",
        notes: lead.notes || "",
        potential_value: lead.potential_value || "",
        company_segment: lead.company_segment || "",
        meeting_date: lead.meeting_date ? lead.meeting_date.split('T')[0] : ""
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const data = {
      ...formData,
      potential_value: formData.potential_value ? parseFloat(formData.potential_value) : null,
      last_contact_date: new Date().toISOString().split('T')[0],
      last_stage_change: now,
      recommendation_done: false
    };

    if (editingLead) {
      // Se mudou de estágio, registrar histórico e atualizar timestamp
      if (editingLead.stage !== formData.stage) {
        data.last_stage_change = now;
        data.recommendation_done = false;
        
        // Registrar histórico
        try {
          await createStageHistoryMutation.mutateAsync({
            lead_id: editingLead.id,
            lead_name: editingLead.name,
            previous_stage: editingLead.stage,
            new_stage: formData.stage,
            changed_by: currentUser?.email || "system",
            change_date: now,
          });
        } catch (error) {
          console.error('Erro ao criar histórico:', error);
        }

        // Se mudou para perdido ou venda_fechada, atualizar oportunidade
        if (editingLead.opportunity_id && (formData.stage === "perdido" || formData.stage === "venda_fechada")) {
          try {
            await updateOpportunityMutation.mutateAsync({
              id: editingLead.opportunity_id,
              data: {
                status: formData.stage === "venda_fechada" ? "won" : "lost",
                actual_close_date: new Date().toISOString().split('T')[0],
              }
            });
          } catch (error) {
            console.error('Erro ao atualizar oportunidade:', error);
          }
        }
      }
      onUpdateLead(editingLead.id, data);
    } else {
      onCreateLead(data);
    }
    setShowForm(false);
    resetForm();
  };

  const handleStageChange = async (lead, newStage) => {
    const now = new Date().toISOString();
    const updateData = { 
      stage: newStage,
      last_contact_date: new Date().toISOString().split('T')[0],
      last_stage_change: now,
      recommendation_done: false
    };

    // Registrar histórico de mudança de fase
    try {
      await createStageHistoryMutation.mutateAsync({
        lead_id: lead.id,
        lead_name: lead.name,
        previous_stage: lead.stage,
        new_stage: newStage,
        changed_by: currentUser?.email || "system",
        change_date: now,
      });
    } catch (error) {
      console.error('Erro ao criar histórico:', error);
    }

    // Define a partir de qual estágio criar oportunidade (whatsapp ou posterior)
    const stagesThatTriggerOpportunity = ["whatsapp", "reuniao_marcada", "no_show", "reuniao_realizada", "proposta_enviada", "segunda_reuniao_marcada", "venda_fechada"];
    
    // Se passou para whatsapp ou estágio posterior, criar oportunidade automaticamente
    if (stagesThatTriggerOpportunity.includes(newStage) && !lead.opportunity_id) {
      try {
        const opportunity = await createOpportunityMutation.mutateAsync({
          title: `${lead.name}${lead.company_segment ? ' - ' + lead.company_segment : ''}`,
          company_name: lead.name,
          stage: "qualification",
          status: "open",
          source: lead.source,
          contact_name: lead.name,
          contact_email: lead.email,
          contact_phone: lead.whatsapp,
          value: lead.potential_value || 0,
          assigned_to: lead.seller_email,
          needs: lead.notes,
          next_step: "Continuar follow-up"
        });
        
        if (opportunity?.id) {
          updateData.opportunity_id = opportunity.id;
        }
      } catch (error) {
        console.error('Erro ao criar oportunidade:', error);
      }
    }

    // Se mudou para perdido ou venda_fechada, atualizar oportunidade se existir
    if (lead.opportunity_id && (newStage === "perdido" || newStage === "venda_fechada")) {
      try {
        await updateOpportunityMutation.mutateAsync({
          id: lead.opportunity_id,
          data: {
            status: newStage === "venda_fechada" ? "won" : "lost",
            actual_close_date: new Date().toISOString().split('T')[0],
          }
        });
      } catch (error) {
        console.error('Erro ao atualizar oportunidade:', error);
      }
    }

    onUpdateLead(lead.id, updateData);
  };

  const handleRecommendationDone = (lead) => {
    onUpdateLead(lead.id, {
      recommendation_done: true,
      last_contact_date: new Date().toISOString().split('T')[0]
    });
  };

  // Leads com recomendações calculadas
  const leadsWithRecommendations = useMemo(() => {
    return leads.map(lead => ({
      ...lead,
      calculatedRecommendation: calculateRecommendation(lead)
    }));
  }, [leads]);

  // Filter leads
  const filteredLeads = leadsWithRecommendations.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.instagram?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
    const matchesSeller = selectedSeller === "all" || lead.seller_email === selectedSeller;
    const matchesRecommendation = !showOnlyWithRecommendation || 
      (lead.calculatedRecommendation !== "aguardar" && 
       lead.calculatedRecommendation !== "nenhuma" && 
       !lead.recommendation_done);
    return matchesSearch && matchesStage && matchesSeller && matchesRecommendation;
  });

  // Count leads per stage
  const stageCounts = stages.reduce((acc, stage) => {
    acc[stage.key] = leadsWithRecommendations.filter(l => 
      l.stage === stage.key && 
      (selectedSeller === "all" || l.seller_email === selectedSeller)
    ).length;
    return acc;
  }, {});

  // Count leads with pending recommendations
  const pendingRecommendations = leadsWithRecommendations.filter(l => 
    l.calculatedRecommendation !== "aguardar" && 
    l.calculatedRecommendation !== "nenhuma" && 
    !l.recommendation_done &&
    (selectedSeller === "all" || l.seller_email === selectedSeller)
  ).length;

  const totalLeads = leadsWithRecommendations.filter(l => 
    selectedSeller === "all" || l.seller_email === selectedSeller
  ).length;

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none">
        <CardHeader className="pb-2 px-3 md:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2 text-sm md:text-lg">
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
              Pipeline
            </CardTitle>
            <div className="flex items-center gap-2">
              {pendingRecommendations > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] md:text-xs px-2">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {pendingRecommendations}
                </Badge>
              )}
              <span className="text-white/60 text-xs">{totalLeads} leads</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 md:px-6 pb-4">
          {/* Mobile: Horizontal scroll */}
          <div className="overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0">
            <div className="flex gap-1 md:gap-3 items-center justify-start md:justify-center min-w-max md:min-w-0 py-1">
              {stages.slice(0, -1).map((stage, idx) => {
                const Icon = stage.icon;
                const count = stageCounts[stage.key] || 0;
                return (
                  <React.Fragment key={stage.key}>
                    <button
                      onClick={() => setStageFilter(stageFilter === stage.key ? "all" : stage.key)}
                      className={`flex flex-col items-center transition-opacity ${stageFilter !== "all" && stageFilter !== stage.key ? 'opacity-40' : ''}`}
                    >
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${stage.color} flex items-center justify-center mb-0.5`}>
                        <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                      </div>
                      <span className="text-white font-bold text-xs md:text-sm">{count}</span>
                      <span className="text-white/70 text-[8px] md:text-[10px] text-center max-w-[45px] md:max-w-[60px] leading-tight truncate">
                        {stage.label}
                      </span>
                    </button>
                    {idx < stages.length - 2 && (
                      <ChevronRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-white/30 flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <div className="flex flex-col gap-3">
        {/* Contador de leads filtrados */}
        {filteredLeads.length !== totalLeads && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-blue-800">
              Mostrando <strong>{filteredLeads.length}</strong> de <strong>{totalLeads}</strong> leads
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchTerm("");
                setStageFilter("all");
                setShowOnlyWithRecommendation(false);
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-7 text-xs"
            >
              Limpar Filtros
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-slate-200"
            />
          </div>
          <Button 
            onClick={() => handleOpenForm()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 h-10 px-3 md:px-4"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Novo Lead</span>
          </Button>
        </div>
        <div className="flex gap-2">
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="flex-1 md:w-[180px] md:flex-none h-10 border-slate-200">
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etapas</SelectItem>
              {stages.map(stage => (
                <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showOnlyWithRecommendation ? "default" : "outline"}
            onClick={() => setShowOnlyWithRecommendation(!showOnlyWithRecommendation)}
            className={`h-10 flex-1 md:flex-none ${showOnlyWithRecommendation ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
          >
            <AlertCircle className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Ações Pendentes</span>
            <span className="md:hidden">{pendingRecommendations}</span>
          </Button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        <AnimatePresence>
          {filteredLeads.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-12 text-center text-slate-500">
                {showOnlyWithRecommendation 
                  ? "Nenhuma ação pendente! 🎉" 
                  : "Nenhum lead encontrado."}
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map(lead => {
              const seller = users.find(u => u.email === lead.seller_email);
              const currentStage = stages.find(s => s.key === lead.stage);
              const StageIcon = currentStage?.icon || Users;
              const recommendation = recommendationLabels[lead.calculatedRecommendation] || recommendationLabels.aguardar;
              const RecommendationIcon = recommendation.icon;
              const showRecommendation = lead.calculatedRecommendation !== "aguardar" && 
                                         lead.calculatedRecommendation !== "nenhuma";
              
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-slate-200">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{lead.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {lead.instagram && (
                              <span className="text-xs text-pink-500 flex items-center gap-1">
                                <Instagram className="w-3 h-3" />
                                {lead.instagram}
                              </span>
                            )}
                            {lead.whatsapp && (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.whatsapp}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(lead)}
                            className="h-8 w-8 text-slate-500"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteLead(lead)}
                            className="h-8 w-8 text-slate-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Stage Selector */}
                      <div className="mb-3">
                        <Select 
                          value={lead.stage} 
                          onValueChange={(v) => handleStageChange(lead, v)}
                        >
                          <SelectTrigger className="h-10 w-full border-slate-200">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full ${currentStage?.color} flex items-center justify-center`}>
                                <StageIcon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="text-sm font-medium">{currentStage?.label}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map(stage => {
                              const Icon = stage.icon;
                              return (
                                <SelectItem key={stage.key} value={stage.key}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full ${stage.color} flex items-center justify-center`}>
                                      <Icon className="w-3 h-3 text-white" />
                                    </div>
                                    {stage.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Recommendation - Sempre mostra */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${recommendation.color}`}>
                          <RecommendationIcon className="w-3.5 h-3.5" />
                          {recommendation.label}
                        </div>
                        {showRecommendation && !lead.recommendation_done ? (
                          <Button
                            size="sm"
                            onClick={() => handleRecommendationDone(lead)}
                            className="h-8 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Feito
                          </Button>
                        ) : showRecommendation && lead.recommendation_done ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Feito
                          </Badge>
                        ) : null}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            {seller?.full_name || lead.seller_email?.split('@')[0]}
                          </span>
                          {lead.source && (
                            <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-600">
                              {sourceLabels[lead.source] || lead.source}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {lead.opportunity_id && (
                            <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-600">
                              CRM
                            </Badge>
                          )}
                          {lead.last_contact_date && (
                            <span className="text-[11px] text-slate-500">
                              {format(parseISO(lead.last_contact_date), "dd/MM", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Table View */}
      <Card className="border-slate-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-3 font-semibold text-slate-700 min-w-[160px]">Lead</th>
                <th className="text-left p-3 font-semibold text-slate-700 min-w-[100px]">Etapa</th>
                <th className="text-left p-3 font-semibold text-slate-700 min-w-[180px]">Recomendação</th>
                <th className="text-center p-3 font-semibold text-slate-700 min-w-[100px]">Último Contato</th>
                <th className="text-center p-3 font-semibold text-slate-700 min-w-[80px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      {showOnlyWithRecommendation 
                        ? "Nenhuma ação pendente! 🎉" 
                        : "Nenhum lead encontrado."}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => {
                    const seller = users.find(u => u.email === lead.seller_email);
                    const currentStage = stages.find(s => s.key === lead.stage);
                    const StageIcon = currentStage?.icon || Users;
                    const recommendation = recommendationLabels[lead.calculatedRecommendation] || recommendationLabels.aguardar;
                    const RecommendationIcon = recommendation.icon;
                    const showRecommendation = lead.calculatedRecommendation !== "aguardar" && 
                                               lead.calculatedRecommendation !== "nenhuma";
                    
                    return (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-slate-100 hover:bg-slate-50/50"
                      >
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-sm">{lead.name}</span>
                            {lead.instagram && (
                              <span className="text-xs text-pink-500 flex items-center gap-1">
                                <Instagram className="w-3 h-3" />
                                {lead.instagram}
                              </span>
                            )}
                            {lead.whatsapp && (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.whatsapp}
                              </span>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-slate-400">
                                {seller?.full_name || lead.seller_email}
                              </span>
                              {lead.source && (
                                <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-600">
                                  {sourceLabels[lead.source] || lead.source}
                                </Badge>
                              )}
                              {lead.opportunity_id && (
                                <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-600">
                                  No CRM
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Select 
                            value={lead.stage} 
                            onValueChange={(v) => handleStageChange(lead, v)}
                          >
                            <SelectTrigger className="h-9 w-[140px] border-slate-200">
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full ${currentStage?.color} flex items-center justify-center`}>
                                  <StageIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs truncate">{currentStage?.label}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map(stage => {
                                const Icon = stage.icon;
                                return (
                                  <SelectItem key={stage.key} value={stage.key}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-5 h-5 rounded-full ${stage.color} flex items-center justify-center`}>
                                        <Icon className="w-3 h-3 text-white" />
                                      </div>
                                      {stage.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${recommendation.color}`}>
                              <RecommendationIcon className="w-3.5 h-3.5" />
                              {recommendation.label}
                            </div>
                            {showRecommendation && !lead.recommendation_done ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRecommendationDone(lead)}
                                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            ) : showRecommendation && lead.recommendation_done ? (
                              <Badge variant="outline" className="text-green-600 border-green-300 text-[10px]">
                                Feito
                              </Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {lead.last_contact_date ? (
                            <span className="text-xs text-slate-600">
                              {format(parseISO(lead.last_contact_date), "dd/MM", { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
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
                              onClick={() => onDeleteLead(lead)}
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
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) resetForm();
      }}>
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
                <Label>Segmento</Label>
                <Input
                  value={formData.company_segment}
                  onChange={(e) => setFormData({ ...formData, company_segment: e.target.value })}
                  placeholder="Ex: E-commerce, SaaS..."
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
              <div className="space-y-2">
                <Label>Data da Reunião</Label>
                <Input
                  type="datetime-local"
                  value={formData.meeting_date}
                  onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                />
              </div>
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