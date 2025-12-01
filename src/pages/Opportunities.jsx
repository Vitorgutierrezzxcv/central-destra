import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, TrendingUp, Kanban, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence } from "framer-motion";

import OpportunityForm from "../components/opportunities/OpportunityForm";
import OpportunityPipeline from "../components/opportunities/OpportunityPipeline";

const stageLabels = {
  prospecting: "Prospecção",
  qualification: "Qualificação",
  presentation: "Apresentação",
  negotiation: "Negociação",
  closing: "Fechamento",
  post_sale: "Pós-venda"
};

const stageColors = {
  prospecting: "bg-slate-100 text-slate-700",
  qualification: "bg-blue-100 text-blue-700",
  presentation: "bg-purple-100 text-purple-700",
  negotiation: "bg-orange-100 text-orange-700",
  closing: "bg-green-100 text-green-700",
  post_sale: "bg-teal-100 text-teal-700"
};

export default function Opportunities() {
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list('-created_date'),
    initialData: [],
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    initialData: [],
  });

  const createOpportunityMutation = useMutation({
    mutationFn: (opportunityData) => base44.entities.Opportunity.create(opportunityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setShowForm(false);
      setEditingOpportunity(null);
    },
  });

  const updateOpportunityMutation = useMutation({
    mutationFn: ({ id, opportunityData }) => base44.entities.Opportunity.update(id, opportunityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setShowForm(false);
      setEditingOpportunity(null);
    },
  });

  const deleteOpportunityMutation = useMutation({
    mutationFn: (id) => base44.entities.Opportunity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const handleSubmit = (opportunityData) => {
    if (editingOpportunity) {
      updateOpportunityMutation.mutate({ id: editingOpportunity.id, opportunityData });
    } else {
      createOpportunityMutation.mutate(opportunityData);
    }
  };

  const handleEdit = (opportunity) => {
    setEditingOpportunity(opportunity);
    setShowForm(true);
  };

  const handleDelete = (opportunityId) => {
    if (window.confirm('Tem certeza que deseja excluir esta oportunidade?')) {
      deleteOpportunityMutation.mutate(opportunityId);
    }
  };

  const filteredOpportunities = opportunities.filter(opp =>
    opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    companies.find(c => c.id === opp.company_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#456C8D] rounded-xl md:rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#131A20]">Oportunidades</h1>
              <p className="text-sm md:text-base text-[#456C8D]">
                {opportunities.length} oportunidade{opportunities.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
              <Input
                placeholder="Buscar oportunidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 bg-white border-[#EAEAEA] h-10 md:h-11 text-sm md:text-base rounded-lg"
              />
            </div>
            <Button 
              onClick={() => {
                setEditingOpportunity(null);
                setShowForm(true);
              }}
              className="bg-[#456C8D] hover:bg-[#131A20] text-white rounded-lg h-10 md:h-11 px-6"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="text-sm md:text-base font-medium">Nova Oportunidade</span>
            </Button>
          </div>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <OpportunityForm
              opportunity={editingOpportunity}
              companies={companies}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingOpportunity(null);
              }}
              isLoading={createOpportunityMutation.isPending || updateOpportunityMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Carregando oportunidades...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-[#EAEAEA] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#131A20] mb-2">Nenhuma oportunidade cadastrada</h3>
            <p className="text-[#456C8D] mb-6">
              Cadastre sua primeira oportunidade e comece a gerenciar seu funil de vendas
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-[#456C8D] hover:bg-[#131A20] text-white rounded-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Cadastrar Primeira Oportunidade
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="pipeline" className="w-full">
            <TabsList className="bg-[#EAEAEA] mb-6 p-1 rounded-lg">
              <TabsTrigger value="pipeline" className="flex items-center gap-2 data-[state=active]:bg-[#456C8D] data-[state=active]:text-white rounded-lg">
                <Kanban className="w-4 h-4" />
                Funil de Vendas
              </TabsTrigger>
              <TabsTrigger value="grid" className="flex items-center gap-2 data-[state=active]:bg-[#456C8D] data-[state=active]:text-white rounded-lg">
                <LayoutGrid className="w-4 h-4" />
                Grade
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline">
              <OpportunityPipeline
                opportunities={filteredOpportunities}
                companies={companies}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStageChange={(opp, newStage) => {
                  updateOpportunityMutation.mutate({
                    id: opp.id,
                    opportunityData: { ...opp, stage: newStage }
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="grid">
              {filteredOpportunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOpportunities.map((opp) => {
                    const company = companies.find(c => c.id === opp.company_id);
                    return (
                      <Card key={opp.id} className="bg-white shadow-md hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-bold text-lg text-slate-900 flex-1">{opp.title}</h3>
                            <Badge className={stageColors[opp.stage]}>
                              {stageLabels[opp.stage]}
                            </Badge>
                          </div>
                          {company && (
                            <p className="text-sm text-slate-600 mb-2">{company.name}</p>
                          )}
                          {opp.value && (
                            <p className="text-[#456C8D] font-semibold text-lg mb-3">
                              R$ {parseFloat(opp.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                          {opp.probability && (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-slate-600 mb-1">
                                <span>Probabilidade</span>
                                <span>{opp.probability}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-[#456C8D] h-2 rounded-full" 
                                  style={{ width: `${opp.probability}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(opp)}
                              className="flex-1"
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(opp.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Excluir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-[#EAEAEA] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#131A20] mb-2">Nenhuma oportunidade encontrada</h3>
                  <p className="text-[#456C8D]">Tente buscar com outros termos</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}