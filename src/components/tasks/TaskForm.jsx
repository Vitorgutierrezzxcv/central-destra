import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, AlertCircle, User } from "lucide-react";

export default function TaskForm({ task, projects, onSubmit, onCancel, isLoading }) {
  const urlParams = new URLSearchParams(window.location.search);
  const currentProjectId = urlParams.get('id');
  
  const [formData, setFormData] = useState(task || {
    title: "",
    description: "",
    project_id: currentProjectId || (projects.length > 0 ? projects[0].id : ""),
    assigned_to: "",
    start_date: "",
    end_date: "",
    status: "pending",
    priority: "medium"
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim() && formData.project_id) {
      // Validar que a data de fim não seja anterior à data de início
      if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
        alert('A data de término não pode ser anterior à data de início');
        return;
      }
      onSubmit(formData);
    }
  };

  if (projects.length === 0) {
    return (
      <Card className="shadow-xl border-none bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-8 pb-6">
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Nenhum projeto disponível
            </h3>
            <p className="text-slate-600 mb-6">
              Você precisa criar um projeto antes de adicionar tarefas
            </p>
            <Button onClick={onCancel}>Entendi</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
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
              {!currentProjectId && (
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
              )}

              <div className="space-y-2">
                <Label htmlFor="assigned_to" className="text-slate-900 font-medium">
                  Responsável
                </Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData({...formData, assigned_to: value})}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Selecione um responsável">
                      {formData.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {users.find(u => u.email === formData.assigned_to)?.full_name || formData.assigned_to}
                        </div>
                      ) : (
                        "Selecione um responsável"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {loadingUsers ? (
                      <SelectItem value={null} disabled>Carregando...</SelectItem>
                    ) : (
                      users.map(user => (
                        <SelectItem key={user.id} value={user.email}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-slate-900 font-medium">
                  Data de Início
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="border-slate-200 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-slate-900 font-medium">
                  Data de Término
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="border-slate-200 focus:border-purple-500"
                  min={formData.start_date}
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
              disabled={isLoading}
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