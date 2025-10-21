import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

export default function TaskForm({ task, projects, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(task || {
    title: "",
    description: "",
    project_id: projects.length > 0 ? projects[0].id : "",
    scheduled_date: "",
    status: "pending",
    priority: "medium"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim() && formData.project_id) {
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
      <Card className="shadow-xl border-none bg-white/90 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-slate-900">
              {task ? 'Editar Tarefa' : 'Nova Tarefa'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-900 font-medium">
                Título da Tarefa *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Criar design da homepage"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="border-slate-200 focus:border-purple-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-900 font-medium">
                Descrição
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva a tarefa..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="h-24 border-slate-200 focus:border-purple-500 resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project" className="text-slate-900 font-medium">
                  Projeto *
                </Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData({...formData, project_id: value})}
                  required
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_date" className="text-slate-900 font-medium">
                  Data de Agendamento
                </Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                  className="border-slate-200 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-900 font-medium">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-slate-900 font-medium">
                  Prioridade
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-200 flex justify-end gap-3">
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
              disabled={isLoading || projects.length === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {task ? 'Atualizar' : 'Criar Tarefa'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}