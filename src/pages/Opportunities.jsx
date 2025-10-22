import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, TrendingUp, LayoutGrid, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence } from "framer-motion";

import OpportunityForm from "../components/opportunities/OpportunityForm";
import OpportunityPipeline from "../components/opportunities/OpportunityPipeline";
import OpportunityList from "../components/opportunities/OpportunityList";
import OpportunityMetrics from "../components/opportunities/OpportunityMetrics";

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

  const { data: activities } = useQuery({
    queryKey: ['opportunity-activities'],
    queryFn: () => base44.entities.OpportunityActivity.list('-created_date'),
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
    mutationFn: async (id) => {
      const oppActivities = activities.filter(a => a.opportunity_id === id);
      await Promise.all(oppActivities.map(a => base44.entities.OpportunityActivity.delete(a.id)));
      await base44.entities.Opportunity.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity-activities'] });
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

  const handleDelete = async (opportunityId) => {
    if (window.confirm('Tem certeza que deseja excluir esta oportunidade?')) {
      deleteOpportunityMutation.mutate(opportunityId);
    }
  };

  const filteredOpportunities = opportunities.filter(opp =>
    opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openOpportunities = filteredOpportunities.filter(o => o.status === 'open').length;
  const totalValue = filteredOpportunities
    .filter(o => o.status === 'open')
    .reduce((sum, o) => sum + (o.value || 0), 0);

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
                {openOpportunities} aberta{openOpportunities !== 1 ? 's' : ''} • R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

        {/* Metrics */}
        <OpportunityMetrics opportunities={filteredOpportunities} />

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

        {/* Tabs View */}
        <Tabs defaultValue="pipeline" className="w-full">
          <TabsList className="bg-white/80 backdrop-blur-sm shadow-md mb-6 p-1 h-auto grid grid-cols-2 w-full sm:w-auto">
            <TabsTrigger value="pipeline" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            <OpportunityPipeline
              opportunities={filteredOpportunities}
              companies={companies}
              onEdit={handleEdit}
              onDelete={handleDelete}
              updateMutation={updateOpportunityMutation}
            />
          </TabsContent>

          <TabsContent value="list">
            <OpportunityList
              opportunities={filteredOpportunities}
              companies={companies}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}