import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ChevronDown, ChevronRight, Plus, ListTodo } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import TaskTemplateFormDialog from "./TaskTemplateFormDialog";
import TaskTemplateItem from "./TaskTemplateItem";

const colorClasses = {
  blue: "from-blue-400 to-blue-500",
  purple: "from-purple-400 to-purple-500",
  green: "from-green-400 to-green-500",
  orange: "from-orange-400 to-orange-500",
  pink: "from-pink-400 to-pink-500",
  red: "from-red-400 to-red-500",
  indigo: "from-indigo-400 to-indigo-500",
  teal: "from-teal-400 to-teal-500",
};

export default function ModuleCard({ module, templates, isExpanded, onToggle, onEdit, onDelete }) {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const createTemplateMutation = useMutation({
    mutationFn: (templateData) => base44.entities.TaskTemplate.create(templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, templateData }) => base44.entities.TaskTemplate.update(id, templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
    },
  });

  const handleTemplateSubmit = (templateData) => {
    const dataWithModule = { ...templateData, module_id: module.id, order: templates.length };
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, templateData: dataWithModule });
    } else {
      createTemplateMutation.mutate(dataWithModule);
    }
  };

  const handleTemplateEdit = (template) => {
    setEditingTemplate(template);
    setShowTemplateDialog(true);
  };

  const handleTemplateDelete = (templateId) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="shadow-lg hover:shadow-xl transition-all border-none rounded-2xl md:rounded-3xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <Link to={`${createPageUrl("ModuleDetail")}?id=${module.id}`}>
            <CardHeader
              className={`bg-gradient-to-br ${colorClasses[module.color] || colorClasses.blue} p-4 md:p-6 cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggle();
                    }}
                  >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </Button>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg md:text-xl mb-1">
                      {module.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">
                        {templates.length} tarefa{templates.length !== 1 ? 's' : ''}
                      </Badge>
                      {module.category && (
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          {module.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(module);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(module.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {module.description && (
                <p className="text-white/90 text-sm mt-2">{module.description}</p>
              )}
            </CardHeader>
          </Link>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <ListTodo className="w-5 h-5" />
                      Templates de Tarefas
                    </h4>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(null);
                        setShowTemplateDialog(true);
                      }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-full h-8"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Tarefa
                    </Button>
                  </div>

                  {templates.length > 0 ? (
                    <div className="space-y-3">
                      {templates.map((template, index) => (
                        <TaskTemplateItem
                          key={template.id}
                          template={template}
                          index={index}
                          onEdit={handleTemplateEdit}
                          onDelete={handleTemplateDelete}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-xl">
                      <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 text-sm">
                        Nenhum template de tarefa ainda
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Adicione templates para reutilizar em projetos
                      </p>
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      <TaskTemplateFormDialog
        isOpen={showTemplateDialog}
        onClose={() => {
          setShowTemplateDialog(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSubmit={handleTemplateSubmit}
        isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
      />
    </>
  );
}