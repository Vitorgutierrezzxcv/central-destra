import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Save, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const colorOptions = [
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "purple", label: "Roxo", class: "bg-purple-500" },
  { value: "green", label: "Verde", class: "bg-green-500" },
  { value: "orange", label: "Laranja", class: "bg-orange-500" },
  { value: "pink", label: "Rosa", class: "bg-pink-500" },
  { value: "red", label: "Vermelho", class: "bg-red-500" },
  { value: "indigo", label: "Índigo", class: "bg-indigo-500" },
  { value: "teal", label: "Azul-petróleo", class: "bg-teal-500" },
];

export default function ModuleForm({ module, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(module || {
    name: "",
    description: "",
    color: "blue",
    category: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-900 font-medium">
          Nome do Módulo *
        </Label>
        <Input
          id="name"
          placeholder="Ex: Autenticação de Usuários"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="border-slate-200 focus:border-indigo-500 rounded-xl"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-slate-900 font-medium">
          Descrição
        </Label>
        <Textarea
          id="description"
          placeholder="Descreva o módulo..."
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="h-24 border-slate-200 focus:border-indigo-500 resize-none rounded-xl"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-slate-900 font-medium">
          Categoria
        </Label>
        <Input
          id="category"
          placeholder="Ex: Backend, Frontend, Design"
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          className="border-slate-200 focus:border-indigo-500 rounded-xl"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-slate-900 font-medium">Cor do Módulo</Label>
        <RadioGroup
          value={formData.color}
          onValueChange={(value) => setFormData({...formData, color: value})}
          className="grid grid-cols-4 md:grid-cols-8 gap-3"
          disabled={isLoading}
        >
          {colorOptions.map((color) => (
            <div key={color.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={color.value}
                id={color.value}
                className="sr-only"
                disabled={isLoading}
              />
              <Label
                htmlFor={color.value}
                className={`
                  w-10 h-10 rounded-lg cursor-pointer border-2 transition-all
                  ${color.class}
                  ${formData.color === color.value 
                    ? 'border-slate-900 scale-110 shadow-lg' 
                    : 'border-transparent hover:scale-105'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title={color.label}
              />
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-full"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {module ? 'Atualizando...' : 'Criando...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {module ? 'Atualizar' : 'Criar Módulo'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}