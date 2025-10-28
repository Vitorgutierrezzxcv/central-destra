import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TaskTemplateForm from "./TaskTemplateForm";

export default function TaskTemplateFormDialog({ isOpen, onClose, template, onSubmit, isLoading }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {template ? 'Editar Template de Tarefa' : 'Novo Template de Tarefa'}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <TaskTemplateForm
            template={template}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}