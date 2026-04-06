import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, X, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const colorOptions = [
  { value: "blue", label: "Blue", gradient: "from-blue-500 to-blue-600" },
  { value: "purple", label: "Purple", gradient: "from-purple-500 to-purple-600" },
  { value: "green", label: "Green", gradient: "from-green-500 to-green-600" },
  { value: "orange", label: "Orange", gradient: "from-orange-500 to-orange-600" },
  { value: "pink", label: "Pink", gradient: "from-pink-500 to-pink-600" },
  { value: "red", label: "Red", gradient: "from-red-500 to-red-600" },
  { value: "indigo", label: "Indigo", gradient: "from-indigo-500 to-indigo-600" },
  { value: "teal", label: "Teal", gradient: "from-teal-500 to-teal-600" },
];

export default function ProjectForm({ project, onSubmit, onCancel, isLoading }) {
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-name'),
  });

  const [currentProject, setCurrentProject] = useState(project || {
    name: "",
    description: "",
    color: "blue",
    status: "active",
    company_id: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentProject.name.trim()) {
      onSubmit(currentProject);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl p-4 md:p-6 mb-6 md:mb-8 border border-[#EAEAEA]"
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-[#131A20]">
          {project ? 'Editar Projeto' : 'Novo Projeto'}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="hover:bg-[#EAEAEA]"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Nome do Projeto *</Label>
          <Input
            id="name"
            placeholder="Ex: Sistema de Vendas"
            value={currentProject.name}
            onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})}
            required
            className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
          <Textarea
            id="description"
            placeholder="Descreva o projeto..."
            value={currentProject.description}
            onChange={(e) => setCurrentProject({...currentProject, description: e.target.value})}
            className="min-h-[80px] md:min-h-[100px] resize-none border-[#EAEAEA] focus:border-[#6FA6FF]"
          />
        </div>

        {/* Empresa vinculada */}
        <div className="space-y-2">
          <Label htmlFor="company" className="text-sm font-medium flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            Empresa (CRM)
          </Label>
          <Select
            value={currentProject.company_id || "none"}
            onValueChange={(value) => setCurrentProject({ ...currentProject, company_id: value === "none" ? "" : value })}
          >
            <SelectTrigger id="company" className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]">
              <SelectValue placeholder="Selecione uma empresa..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma empresa</SelectItem>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}{c.segment ? ` — ${c.segment}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm font-medium">Cor</Label>
            <Select
              value={currentProject.color}
              onValueChange={(value) => setCurrentProject({...currentProject, color: value})}
            >
              <SelectTrigger id="color" className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]">
                <SelectValue placeholder="Escolha uma cor" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded bg-gradient-to-br ${option.gradient}`} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select
              value={currentProject.status}
              onValueChange={(value) => setCurrentProject({...currentProject, status: value})}
            >
              <SelectTrigger id="status" className="h-10 md:h-11 border-[#EAEAEA] focus:border-[#6FA6FF]">
                <SelectValue placeholder="Status do projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto h-10 md:h-11"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#6FA6FF] hover:bg-[#456C8D] text-white h-10 md:h-11"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {project ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              <>
                {project ? 'Salvar' : 'Criar Projeto'}
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}