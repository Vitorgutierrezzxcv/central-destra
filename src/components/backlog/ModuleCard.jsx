import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ChevronDown, ChevronRight, Plus, ListTodo } from "lucide-react";

import TaskTemplateFormDialog from "./TaskTemplateFormDialog";
import TaskTemplateItem from "./TaskTemplateItem";

const colorClasses = {
  blue: "bg-[#6FA6FF]",
  purple: "bg-[#456C8D]",
  green: "bg-[#6FA6FF]",
  orange: "bg-[#456C8D]",
  pink: "bg-[#6FA6FF]",
  red: "bg-[#456C8D]",
  indigo: "bg-[#6FA6FF]",
  teal: "bg-[#456C8D]",
};

export default function ModuleCard({ module, templates, isExpanded, onToggle, onEdit, onDelete }) {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const createTemplateMutation = useMutation({
    mutationFn: async ({ templateData, subtemplates }) => {
      const createdTemplate = await base44.entities.TaskTemplate.create(templateData);
      
      // Create subtemplates if any
      if (subtemplates && subtemplates.length > 0) {
        await base44.entities.TaskTemplateSubTask.bulkCreate(
          subtemplates.map((sub, index) => ({
            template_id: createdTemplate.id,
            title: sub.title,
            priority: sub.priority,
            estimated_days: sub.estimated_days,
            order: index
          }))
        );
      }
      
      return createdTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['template-subtasks'] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, templateData, subtemplates }) => {
      await base44.entities.TaskTemplate.update(id, templateData);
      
      // Handle subtemplates
      const existingSubtemplates = await base44.entities.TaskTemplateSubTask.filter({ template_id: id });
      const existingIds = new Set(existingSubtemplates.map(st => st.id));
      
      // Delete removed subtemplates
      const currentIds = new Set(subtemplates.filter(st => st.id && !String(st.id).startsWith('temp-')).map(st => st.id));
      const toDelete = existingSubtemplates.filter(st => !currentIds.has(st.id));
      await Promise.all(toDelete.map(st => base44.entities.TaskTemplateSubTask.delete(st.id)));
      
      // Update or create subtemplates
      const operations = subtemplates.map((sub, index) => {
        const subtemplateData = {
          template_id: id,
          title: sub.title,
          priority: sub.priority,
          estimated_days: sub.estimated_days,
          order: index
        };
        
        if (sub.id && !String(sub.id).startsWith('temp-') && existingIds.has(sub.id)) {
          return base44.entities.TaskTemplateSubTask.update(sub.id, subtemplateData);
        } else {
          return base44.entities.TaskTemplateSubTask.create(subtemplateData);
        }
      });
      
      await Promise.all(operations);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['template-subtasks'] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id) => {
      // Delete subtemplates first
      const subtemplates = await base44.entities.TaskTemplateSubTask.filter({ template_id: id });
      await Promise.all(subtemplates.map(st => base44.entities.TaskTemplateSubTask.delete(st.id)));
      await base44.entities.TaskTemplate.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['template-subtasks'] });
    },
  });

  const handleTemplateSubmit = (templateData, subtemplates = []) => {
    const dataWithModule = { ...templateData, module_id: module.id, order: templates.length };
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, templateData: dataWithModule, subtemplates });
    } else {
      createTemplateMutation.mutate({ templateData: dataWithModule, subtemplates });
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
        <Card className="shadow-sm hover:shadow-md transition-all border border-[#EAEAEA] dark:border-[#30363d] rounded-xl bg-white dark:bg-[#161b22] overflow-hidden">
          <CardHeader 
            className={`${colorClasses[module.color] || colorClasses.blue} p-4 md:p-6 cursor-pointer`}
            onClick={onToggle}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full h-8 w-8"
                  onClick={(e) => {
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
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                  onClick={(e) => {
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
                    <h4 className="font-semibold text-[#131A20] dark:text-white flex items-center gap-2">
                      <ListTodo className="w-5 h-5 text-[#456C8D] dark:text-[#8b949e]" />
                      Templates de Tarefas
                    </h4>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(null);
                        setShowTemplateDialog(true);
                      }}
                      className="bg-[#6FA6FF] hover:bg-[#456C8D] text-white rounded-lg h-8"
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
                    <div className="text-center py-8 bg-[#EAEAEA]/30 dark:bg-[#21262d] rounded-xl">
                      <ListTodo className="w-12 h-12 text-[#EAEAEA] mx-auto mb-3" />
                      <p className="text-[#456C8D] dark:text-[#8b949e] text-sm">
                        Nenhum template de tarefa ainda
                      </p>
                      <p className="text-[#456C8D] dark:text-[#8b949e] text-xs mt-1">
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