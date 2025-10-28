import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ModuleForm from "./ModuleForm";

export default function ModuleFormDialog({ isOpen, onClose, module, onSubmit, isLoading }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {module ? 'Editar Módulo' : 'Novo Módulo'}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ModuleForm
            module={module}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}