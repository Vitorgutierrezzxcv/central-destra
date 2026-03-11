import React, { useState } from "react";
import PullToRefresh from "../components/mobile/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AnimatePresence } from "framer-motion";
import CompanyCard from "../components/crm/CompanyCard";
import CompanyForm from "../components/crm/CompanyForm";

export default function Companies() {
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date'),
    initialData: [],
  });

  const createCompanyMutation = useMutation({
    mutationFn: (companyData) => base44.entities.Company.create(companyData),
    onMutate: async (companyData) => {
      await queryClient.cancelQueries({ queryKey: ['companies'] });
      const prev = queryClient.getQueryData(['companies']);
      const temp = { id: `temp-${Date.now()}`, ...companyData, created_date: new Date().toISOString() };
      queryClient.setQueryData(['companies'], old => [temp, ...(old || [])]);
      return { prev };
    },
    onError: (_err, _data, ctx) => queryClient.setQueryData(['companies'], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
    onSuccess: () => { setShowForm(false); setEditingCompany(null); },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, companyData }) => base44.entities.Company.update(id, companyData),
    onMutate: async ({ id, companyData }) => {
      await queryClient.cancelQueries({ queryKey: ['companies'] });
      const prev = queryClient.getQueryData(['companies']);
      queryClient.setQueryData(['companies'], old =>
        (old || []).map(c => c.id === id ? { ...c, ...companyData } : c)
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => queryClient.setQueryData(['companies'], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
    onSuccess: () => { setShowForm(false); setEditingCompany(null); },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id) => base44.entities.Company.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['companies'] });
      const prev = queryClient.getQueryData(['companies']);
      queryClient.setQueryData(['companies'], old => (old || []).filter(c => c.id !== id));
      return { prev };
    },
    onError: (_err, _data, ctx) => queryClient.setQueryData(['companies'], ctx?.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  const handleSubmit = (companyData) => {
    if (editingCompany) {
      updateCompanyMutation.mutate({ id: editingCompany.id, companyData });
    } else {
      createCompanyMutation.mutate(companyData);
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleDelete = async (companyId) => {
    if (window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      deleteCompanyMutation.mutate(companyId);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.segment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const leadCount = filteredCompanies.filter(c => c.status === 'lead').length;
  const clientCount = filteredCompanies.filter(c => c.status === 'client').length;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#456C8D] rounded-xl md:rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#131A20]">Cadastro de Empresas</h1>
              <p className="text-sm md:text-base text-[#456C8D]">
                {leadCount} lead{leadCount !== 1 ? 's' : ''} • {clientCount} cliente{clientCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
              <Input
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 bg-white border-[#EAEAEA] h-10 md:h-11 text-sm md:text-base rounded-lg"
              />
            </div>
            <Button 
              onClick={() => {
                setEditingCompany(null);
                setShowForm(true);
              }}
              className="bg-[#456C8D] hover:bg-[#131A20] text-white rounded-lg h-10 md:h-11 px-6"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="text-sm md:text-base font-medium">Nova Empresa</span>
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <CompanyForm
              company={editingCompany}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingCompany(null);
              }}
              isLoading={createCompanyMutation.isPending || updateCompanyMutation.isPending}
            />
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-[#EAEAEA] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence>
              {filteredCompanies.map(company => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 md:py-24">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-[#EAEAEA] rounded-xl md:rounded-2xl flex items-center justify-center mb-6">
              <Building2 className="w-10 h-10 md:w-16 md:h-16 text-[#456C8D]" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-[#131A20] mb-2">
              {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
            </h3>
            <p className="text-sm md:text-base text-[#456C8D] mb-6 md:mb-8 text-center max-w-md px-4">
              {searchTerm 
                ? 'Tente buscar com outros termos ou cadastre uma nova empresa' 
                : 'Cadastre sua primeira empresa e comece a gerenciar seus clientes'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-[#456C8D] hover:bg-[#131A20] text-white rounded-lg h-11 md:h-12 px-6 md:px-8 text-sm md:text-base font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Cadastrar Primeira Empresa
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}