import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence } from "framer-motion";

import OpportunityForm from "../components/opportunities/OpportunityForm";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Oportunidades</h1>
              <p className="text-sm md:text-base text-slate-600">
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
                className="pl-9 md:pl-10 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm h-10 md:h-11 text-sm md:text-base rounded-full"
              />
            </div>
            <Button 
              onClick={() => {
                setEditingOpportunity(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg rounded-full h-10 md:h-11 px-6"
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
        ) : filteredOpportunities.length > 0 ? (
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
                      <p className="text-emerald-600 font-semibold text-lg mb-3">
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
                            className="bg-emerald-500 h-2 rounded-full" 
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
            <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {searchTerm ? 'Nenhuma oportunidade encontrada' : 'Nenhuma oportunidade cadastrada'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos' 
                : 'Cadastre sua primeira oportunidade e comece a gerenciar seu funil de vendas'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg rounded-full"
              >
                <Plus className="w-5 h-5 mr-2" />
                Cadastrar Primeira Oportunidade
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}