import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, ListTodo } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import TaskTemplateFormDialog from "../backlog/TaskTemplateFormDialog";
import TaskTemplateItem from "../backlog/TaskTemplateItem";

export default function TaskTemplateList({ templates, moduleId }) {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const createTemplateMutation = useMutation({
    mutationFn: (templateData) => base44.entities.TaskTemplate.create(templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-templates', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, templateData }) => base44.entities.TaskTemplate.update(id, templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-templates', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-templates', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
    },
  });

  const handleTemplateSubmit = (templateData) => {
    const dataWithModule = { ...templateData, module_id: moduleId, order: templates.length };
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
      <div className="mb-6">
        <Button
          onClick={() => {
            setEditingTemplate(null);
            setShowTemplateDialog(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Tarefa
        </Button>
      </div>

      {templates.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {templates.map((template, index) => (
              <TaskTemplateItem
                key={template.id}
                template={template}
                index={index}
                onEdit={handleTemplateEdit}
                onDelete={handleTemplateDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-2">Nenhum template de tarefa ainda</p>
          <p className="text-slate-500 text-sm">
            Adicione templates para reutilizar em projetos
          </p>
        </div>
      )}

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