import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Package, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

import ModuleFormDialog from "../components/backlog/ModuleFormDialog";
import ModuleCard from "../components/backlog/ModuleCard";

export default function Backlog() {
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedModules, setExpandedModules] = useState([]);
  const queryClient = useQueryClient();

  const { data: modules, isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: () => base44.entities.Module.list('-created_date'),
    initialData: [],
  });

  const { data: templates } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => base44.entities.TaskTemplate.list('order'),
    initialData: [],
  });

  const createModuleMutation = useMutation({
    mutationFn: (moduleData) => base44.entities.Module.create(moduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setShowModuleDialog(false);
      setEditingModule(null);
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, moduleData }) => base44.entities.Module.update(id, moduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setShowModuleDialog(false);
      setEditingModule(null);
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id) => {
      const moduleTemplates = templates.filter(t => t.module_id === id);
      await Promise.all(moduleTemplates.map(t => base44.entities.TaskTemplate.delete(t.id)));
      await base44.entities.Module.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
    },
  });

  const handleSubmit = (moduleData) => {
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, moduleData });
    } else {
      createModuleMutation.mutate(moduleData);
    }
  };

  const handleEdit = (module) => {
    setEditingModule(module);
    setShowModuleDialog(true);
  };

  const handleDelete = async (moduleId) => {
    if (window.confirm('Tem certeza que deseja excluir este módulo? Todos os templates de tarefas serão removidos.')) {
      deleteModuleMutation.mutate(moduleId);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getModuleTemplates = (moduleId) => {
    return templates.filter(t => t.module_id === moduleId);
  };

  // Get unique categories
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(modules.filter(m => m.category).map(m => m.category))];
    return uniqueCategories.sort();
  }, [modules]);

  const filteredModules = modules.filter(module => {
    const searchMatch = 
      module.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const categoryMatch = categoryFilter === "all" || module.category === categoryFilter;
    
    return searchMatch && categoryMatch;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#6FA6FF] rounded-xl md:rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#131A20]">Backlog</h1>
              <p className="text-sm md:text-base text-[#456C8D]">
                {filteredModules.length} módulo{filteredModules.length !== 1 ? 's' : ''} 
                {categoryFilter !== "all" && ` na categoria ${categoryFilter}`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#456C8D] w-4 h-4 md:w-5 md:h-5" />
                <Input
                  placeholder="Buscar módulos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 md:pl-10 bg-white border-[#EAEAEA] h-10 md:h-11 text-sm md:text-base rounded-lg"
                />
              </div>
              
              <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-white border border-[#EAEAEA] rounded-lg px-3 h-10 md:h-11">
                  <Filter className="w-4 h-4 text-[#456C8D]" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="border-0 h-auto p-0 focus:ring-0 text-sm md:text-base">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Categorias</SelectItem>
                      {categories.length > 0 ? (
                        categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          Nenhuma categoria encontrada
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={() => {
                    setEditingModule(null);
                    setShowModuleDialog(true);
                  }}
                  className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg h-10 md:h-11 px-6"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  <span className="text-sm md:text-base font-medium">Novo Módulo</span>
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {categoryFilter !== "all" && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-[#456C8D]">Filtros ativos:</span>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-[#EAEAEA] bg-[#EAEAEA] text-[#131A20]"
                  onClick={() => setCategoryFilter("all")}
                >
                  {categoryFilter}
                  <button className="ml-1 hover:text-[#131A20]">×</button>
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Module Form Dialog */}
        <ModuleFormDialog
          isOpen={showModuleDialog}
          onClose={() => {
            setShowModuleDialog(false);
            setEditingModule(null);
          }}
          module={editingModule}
          onSubmit={handleSubmit}
          isLoading={createModuleMutation.isPending || updateModuleMutation.isPending}
        />

        {/* Modules Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-[#EAEAEA] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredModules.length > 0 ? (
          <div className="space-y-4 md:space-y-6">
            <AnimatePresence>
              {filteredModules.map(module => {
                const moduleTemplates = getModuleTemplates(module.id);
                const isExpanded = expandedModules.includes(module.id);

                return (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    templates={moduleTemplates}
                    isExpanded={isExpanded}
                    onToggle={() => toggleModule(module.id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 md:py-24">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-[#EAEAEA] rounded-xl md:rounded-2xl flex items-center justify-center mb-6">
              <Package className="w-10 h-10 md:w-16 md:h-16 text-[#456C8D]" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-[#131A20] mb-2">
              {searchTerm || categoryFilter !== "all" ? 'Nenhum módulo encontrado' : 'Nenhum módulo ainda'}
            </h3>
            <p className="text-sm md:text-base text-[#456C8D] mb-6 md:mb-8 text-center max-w-md px-4">
              {searchTerm || categoryFilter !== "all"
                ? 'Tente ajustar os filtros ou crie um novo módulo' 
                : 'Crie seu primeiro módulo e adicione templates de tarefas reutilizáveis'}
            </p>
            {!(searchTerm || categoryFilter !== "all") && (
              <Button 
                onClick={() => setShowModuleDialog(true)}
                className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg h-11 md:h-12 px-6 md:px-8 text-sm md:text-base font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Módulo
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}