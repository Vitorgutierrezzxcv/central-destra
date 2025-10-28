import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Package,
  FileText,
  Paperclip,
  Download,
  Upload,
  ListTodo,
  TrendingUp,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence } from "framer-motion";

import ModuleFormDialog from "../components/backlog/ModuleFormDialog";
import PlaybookForm from "../components/module-detail/PlaybookForm";
import PlaybookCard from "../components/module-detail/PlaybookCard";
import AttachmentUploader from "../components/module-detail/AttachmentUploader";
import AttachmentList from "../components/module-detail/AttachmentList";
import TaskTemplateList from "../components/module-detail/TaskTemplateList";
import ExecutionStats from "../components/module-detail/ExecutionStats";

const colorClasses = {
  blue: "from-blue-400 to-blue-600",
  purple: "from-purple-400 to-purple-600",
  green: "from-green-400 to-green-600",
  orange: "from-orange-400 to-orange-600",
  pink: "from-pink-400 to-pink-600",
  red: "from-red-400 to-red-600",
  indigo: "from-indigo-400 to-indigo-600",
  teal: "from-teal-400 to-teal-600",
};

export default function ModuleDetail() {
  const navigate = useNavigate();
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showPlaybookForm, setShowPlaybookForm] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState(null);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const moduleId = urlParams.get('id');

  const { data: module, isLoading: loadingModule } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: async () => {
      const modules = await base44.entities.Module.list();
      return modules.find(m => m.id === moduleId);
    },
    enabled: !!moduleId,
  });

  const { data: templates } = useQuery({
    queryKey: ['module-templates', moduleId],
    queryFn: () => base44.entities.TaskTemplate.filter({ module_id: moduleId }, 'order'),
    initialData: [],
    enabled: !!moduleId,
  });

  const { data: playbooks } = useQuery({
    queryKey: ['module-playbooks', moduleId],
    queryFn: () => base44.entities.ModulePlaybook.filter({ module_id: moduleId }, 'order'),
    initialData: [],
    enabled: !!moduleId,
  });

  const { data: attachments } = useQuery({
    queryKey: ['module-attachments', moduleId],
    queryFn: () => base44.entities.ModuleAttachment.filter({ module_id: moduleId }, '-created_date'),
    initialData: [],
    enabled: !!moduleId,
  });

  const { data: executionHistory } = useQuery({
    queryKey: ['module-execution-history', moduleId],
    queryFn: async () => {
      const allHistory = await base44.entities.TaskExecutionHistory.list('-completed_date');
      const templateIds = templates.map(t => t.id);
      return allHistory.filter(h => templateIds.includes(h.template_id));
    },
    initialData: [],
    enabled: !!moduleId && templates.length > 0,
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, moduleData }) => base44.entities.Module.update(id, moduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      setShowModuleForm(false);
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id) => {
      await Promise.all([
        ...templates.map(t => base44.entities.TaskTemplate.delete(t.id)),
        ...playbooks.map(p => base44.entities.ModulePlaybook.delete(p.id)),
        ...attachments.map(a => base44.entities.ModuleAttachment.delete(a.id))
      ]);
      await base44.entities.Module.delete(id);
    },
    onSuccess: () => {
      navigate(createPageUrl("Backlog"));
    },
  });

  const createPlaybookMutation = useMutation({
    mutationFn: (playbookData) => base44.entities.ModulePlaybook.create(playbookData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-playbooks', moduleId] });
      setShowPlaybookForm(false);
      setEditingPlaybook(null);
    },
  });

  const updatePlaybookMutation = useMutation({
    mutationFn: ({ id, playbookData }) => base44.entities.ModulePlaybook.update(id, playbookData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-playbooks', moduleId] });
      setShowPlaybookForm(false);
      setEditingPlaybook(null);
    },
  });

  const deletePlaybookMutation = useMutation({
    mutationFn: (id) => base44.entities.ModulePlaybook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-playbooks', moduleId] });
    },
  });

  const handleModuleSubmit = (moduleData) => {
    updateModuleMutation.mutate({ id: moduleId, moduleData });
  };

  const handleModuleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este módulo? Todos os templates, playbooks e anexos serão removidos.')) {
      deleteModuleMutation.mutate(moduleId);
    }
  };

  const handlePlaybookSubmit = (playbookData) => {
    const dataWithModule = { ...playbookData, module_id: moduleId, order: playbooks.length };
    if (editingPlaybook) {
      updatePlaybookMutation.mutate({ id: editingPlaybook.id, playbookData: dataWithModule });
    } else {
      createPlaybookMutation.mutate(dataWithModule);
    }
  };

  const handlePlaybookEdit = (playbook) => {
    setEditingPlaybook(playbook);
    setShowPlaybookForm(true);
  };

  const handlePlaybookDelete = (playbookId) => {
    if (window.confirm('Tem certeza que deseja excluir este playbook?')) {
      deletePlaybookMutation.mutate(playbookId);
    }
  };

  if (!moduleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Módulo não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl("Backlog"))} className="mt-4">
            Voltar para Backlog
          </Button>
        </div>
      </div>
    );
  }

  if (loadingModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <Skeleton className="h-12 md:h-16 w-full rounded-2xl md:rounded-3xl" />
          <Skeleton className="h-24 md:h-32 w-full rounded-2xl md:rounded-3xl" />
          <Skeleton className="h-64 md:h-96 w-full rounded-2xl md:rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Módulo não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl("Backlog"))}>
            Voltar para Backlog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Backlog"))}
            className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg border-slate-200 rounded-full h-10 w-10 md:h-12 md:w-12"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 w-full">
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-gradient-to-br ${colorClasses[module.color]} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <span className="text-xl md:text-3xl text-white font-bold">{module.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 truncate">{module.name}</h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 line-clamp-2">{module.description || "Sem descrição"}</p>
              {module.category && (
                <span className="inline-block mt-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                  {module.category}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowModuleForm(true)}
              className="flex-1 sm:flex-initial bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg border-slate-200 rounded-full h-9 w-9 md:h-10 md:w-10"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleModuleDelete}
              className="flex-1 sm:flex-initial bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg border-slate-200 rounded-full h-9 w-9 md:h-10 md:w-10 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Module Form Dialog */}
        <ModuleFormDialog
          isOpen={showModuleForm}
          onClose={() => setShowModuleForm(false)}
          module={module}
          onSubmit={handleModuleSubmit}
          isLoading={updateModuleMutation.isPending}
        />

        {/* Stats Cards */}
        <ExecutionStats 
          templates={templates}
          executionHistory={executionHistory}
        />

        {/* Main Content Tabs */}
        <Card className="shadow-xl border-none rounded-2xl md:rounded-3xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Tabs defaultValue="templates" className="w-full">
              <div className="border-b border-slate-200 px-4 md:px-6">
                <TabsList className="bg-transparent w-full grid grid-cols-3 md:flex">
                  <TabsTrigger value="templates" className="flex items-center gap-2 text-xs md:text-sm data-[state=active]:border-b-2 data-[state=active]:border-purple-500">
                    <ListTodo className="w-4 h-4" />
                    <span className="hidden sm:inline">Templates</span>
                  </TabsTrigger>
                  <TabsTrigger value="playbooks" className="flex items-center gap-2 text-xs md:text-sm data-[state=active]:border-b-2 data-[state=active]:border-purple-500">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Playbooks</span>
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="flex items-center gap-2 text-xs md:text-sm data-[state=active]:border-b-2 data-[state=active]:border-purple-500">
                    <Paperclip className="w-4 h-4" />
                    <span className="hidden sm:inline">Anexos</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="templates" className="p-4 md:p-6 mt-0">
                <TaskTemplateList 
                  templates={templates}
                  moduleId={moduleId}
                />
              </TabsContent>

              <TabsContent value="playbooks" className="p-4 md:p-6 mt-0">
                <div className="mb-6">
                  <Button
                    onClick={() => {
                      setEditingPlaybook(null);
                      setShowPlaybookForm(true);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg rounded-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Playbook
                  </Button>
                </div>

                <AnimatePresence>
                  {showPlaybookForm && (
                    <PlaybookForm
                      playbook={editingPlaybook}
                      onSubmit={handlePlaybookSubmit}
                      onCancel={() => {
                        setShowPlaybookForm(false);
                        setEditingPlaybook(null);
                      }}
                      isLoading={createPlaybookMutation.isPending || updatePlaybookMutation.isPending}
                    />
                  )}
                </AnimatePresence>

                {playbooks.length > 0 ? (
                  <div className="space-y-4">
                    {playbooks.map((playbook, index) => (
                      <PlaybookCard
                        key={playbook.id}
                        playbook={playbook}
                        index={index}
                        onEdit={handlePlaybookEdit}
                        onDelete={handlePlaybookDelete}
                      />
                    ))}
                  </div>
                ) : !showPlaybookForm && (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 mb-2">Nenhum playbook ainda</p>
                    <p className="text-slate-500 text-sm">
                      Crie playbooks para documentar processos e guias de execução
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="attachments" className="p-4 md:p-6 mt-0">
                <AttachmentUploader moduleId={moduleId} />
                <AttachmentList 
                  attachments={attachments}
                  moduleId={moduleId}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}