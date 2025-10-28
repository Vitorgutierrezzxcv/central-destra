import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search, Package, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import ModuleForm from "../components/backlog/ModuleForm";
import ModuleCard from "../components/backlog/ModuleCard";
import TaskTemplateForm from "../components/backlog/TaskTemplateForm";

export default function Backlog() {
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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
      setShowModuleForm(false);
      setEditingModule(null);
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, moduleData }) => base44.entities.Module.update(id, moduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setShowModuleForm(false);
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
    setShowModuleForm(true);
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

  const filteredModules = modules.filter(module =>
    module.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900">Backlog</h1>
              <p className="text-sm md:text-base text-slate-600">
                {modules.length} módulo{modules.length !== 1 ? 's' : ''} disponíve{modules.length !== 1 ? 'is' : 'l'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
              <Input
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 md:pl-10 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm h-10 md:h-11 text-sm md:text-base rounded-full"
              />
            </div>
            <Button 
              onClick={() => {
                setEditingModule(null);
                setShowModuleForm(true);
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg rounded-full h-10 md:h-11 px-6"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="text-sm md:text-base font-medium">Novo Módulo</span>
            </Button>
          </div>
        </div>

        {/* Module Form */}
        <AnimatePresence>
          {showModuleForm && (
            <ModuleForm
              module={editingModule}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowModuleForm(false);
                setEditingModule(null);
              }}
              isLoading={createModuleMutation.isPending || updateModuleMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* Modules Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white/50 rounded-2xl md:rounded-3xl animate-pulse" />
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
            <div className="w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl md:rounded-[2rem] flex items-center justify-center mb-6 shadow-lg">
              <Package className="w-10 h-10 md:w-16 md:h-16 text-indigo-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
              {searchTerm ? 'Nenhum módulo encontrado' : 'Nenhum módulo ainda'}
            </h3>
            <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-8 text-center max-w-md px-4">
              {searchTerm 
                ? 'Tente buscar com outros termos ou crie um novo módulo' 
                : 'Crie seu primeiro módulo e adicione templates de tarefas reutilizáveis'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowModuleForm(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg rounded-full h-11 md:h-12 px-6 md:px-8 text-sm md:text-base font-medium"
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