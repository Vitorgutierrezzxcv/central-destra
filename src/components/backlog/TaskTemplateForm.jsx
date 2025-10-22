import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

export default function TaskTemplateForm({ template, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(template || {
    title: "",
    description: "",
    priority: "medium",
    estimated_days: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="bg-slate-50 border-slate-200 rounded-xl">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-900 font-medium text-sm">
                Título da Tarefa *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Implementar login com OAuth"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="border-slate-200 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-900 font-medium text-sm">
                Descrição
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva o que precisa ser feito..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="h-20 border-slate-200 resize-none rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-900 font-medium text-sm">
                  Prioridade
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger className="border-slate-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_days" className="text-slate-900 font-medium text-sm">
                  Dias Estimados
                </Label>
                <Input
                  id="estimated_days"
                  type="number"
                  min="1"
                  value={formData.estimated_days}
                  onChange={(e) => setFormData({...formData, estimated_days: parseInt(e.target.value)})}
                  className="border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                size="sm"
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-full"
              >
                <Save className="w-3 h-3 mr-1" />
                {template ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}