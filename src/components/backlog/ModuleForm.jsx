import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Save } from "lucide-react";
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
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="shadow-xl border-none bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-slate-900">
              {module ? 'Editar Módulo' : 'Novo Módulo'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-6">
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
              />
            </div>

            <div className="space-y-3">
              <Label className="text-slate-900 font-medium">Cor do Módulo</Label>
              <RadioGroup
                value={formData.color}
                onValueChange={(value) => setFormData({...formData, color: value})}
                className="grid grid-cols-4 md:grid-cols-8 gap-3"
              >
                {colorOptions.map((color) => (
                  <div key={color.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={color.value}
                      id={color.value}
                      className="sr-only"
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
                      `}
                      title={color.label}
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-200 flex justify-end gap-3">
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
              <Save className="w-4 h-4 mr-2" />
              {module ? 'Atualizar' : 'Criar Módulo'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}