import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import RichTextEditor from "../tasks/RichTextEditor";

export default function PlaybookForm({ playbook, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(playbook || {
    title: "",
    content: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim() && formData.content.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200"
    >
      <h3 className="text-xl font-bold text-slate-900 mb-4">
        {playbook ? 'Editar Playbook' : 'Novo Playbook'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">Título do Playbook *</Label>
          <Input
            id="title"
            placeholder="Ex: Como configurar autenticação"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-sm font-medium">Conteúdo *</Label>
          <RichTextEditor
            value={formData.content}
            onChange={(value) => setFormData({...formData, content: value})}
            placeholder="Descreva o processo, adicione listas, links e instruções..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {playbook ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              <>
                {playbook ? 'Salvar Alterações' : 'Criar Playbook'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}