import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Plus, GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TaskTemplateForm({ template, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(template || {
    title: "",
    description: "",
    priority: "medium",
    estimated_days: 1
  });

  const [subtemplates, setSubtemplates] = useState([]);

  // Fetch existing subtemplates if editing
  const { data: existingSubtemplates } = useQuery({
    queryKey: ['template-subtasks', template?.id],
    queryFn: () => template?.id ? base44.entities.TaskTemplateSubTask.filter({ template_id: template.id }, 'order') : Promise.resolve([]),
    enabled: !!template?.id,
    initialData: [],
  });

  React.useEffect(() => {
    if (existingSubtemplates && existingSubtemplates.length > 0) {
      setSubtemplates(existingSubtemplates);
    }
  }, [existingSubtemplates]);

  const [newSubtemplate, setNewSubtemplate] = useState({
    title: "",
    priority: "medium",
    estimated_days: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit(formData, subtemplates);
    }
  };

  const handleAddSubtemplate = () => {
    if (newSubtemplate.title.trim()) {
      setSubtemplates([
        ...subtemplates,
        {
          id: `temp-${Date.now()}`,
          ...newSubtemplate,
          order: subtemplates.length
        }
      ]);
      setNewSubtemplate({
        title: "",
        priority: "medium",
        estimated_days: 1
      });
    }
  };

  const handleRemoveSubtemplate = (index) => {
    setSubtemplates(subtemplates.filter((_, i) => i !== index));
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

            {/* Subtemplates Section */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <Label className="text-slate-900 font-medium text-sm">
                  Subtarefas do Template
                </Label>
                {subtemplates.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {subtemplates.length} subtarefa{subtemplates.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {subtemplates.length > 0 && (
                <div className="space-y-2">
                  {subtemplates.map((subtemplate, index) => (
                    <div
                      key={subtemplate.id || index}
                      className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 group"
                    >
                      <GripVertical className="w-4 h-4 text-slate-400" />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-slate-900">{subtemplate.title}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {subtemplate.priority === 'high' ? 'Alta' : subtemplate.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {subtemplate.estimated_days} dia{subtemplate.estimated_days !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSubtemplate(index)}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Card className="bg-white border-slate-200">
                <CardContent className="p-3 space-y-2">
                  <Input
                    placeholder="Título da subtarefa"
                    value={newSubtemplate.title}
                    onChange={(e) => setNewSubtemplate({...newSubtemplate, title: e.target.value})}
                    className="h-8 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={newSubtemplate.priority}
                      onValueChange={(value) => setNewSubtemplate({...newSubtemplate, priority: value})}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Dias"
                      value={newSubtemplate.estimated_days}
                      onChange={(e) => setNewSubtemplate({...newSubtemplate, estimated_days: parseInt(e.target.value)})}
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddSubtemplate}
                    disabled={!newSubtemplate.title.trim()}
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar Subtarefa
                  </Button>
                </CardContent>
              </Card>
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