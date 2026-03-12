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

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['companies'] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-[#F7F7F7] p-5 md:p-7 lg:p-9">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-[26px] font-light text-[#131A20] tracking-tight">Empresas</h1>
              <p className="text-sm font-light text-[#456C8D] mt-0.5">
                {leadCount} lead{leadCount !== 1 ? 's' : ''} · {clientCount} cliente{clientCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={() => { setEditingCompany(null); setShowForm(true); }}
              className="w-full sm:w-auto bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-xl h-10 font-light shadow-none border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#456C8D] w-4 h-4" />
            <Input
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-[#EAEAEA] h-10 text-sm rounded-xl focus:ring-[#6FA6FF]"
            />
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
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#EAEAEA] rounded-2xl">
            <div className="w-16 h-16 bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl flex items-center justify-center mb-5">
              <Building2 className="w-8 h-8 text-[#456C8D]" />
            </div>
            <h3 className="text-lg font-normal text-[#131A20] mb-1.5">
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
    </PullToRefresh>
  );
}