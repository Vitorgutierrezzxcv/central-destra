
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Calendar, User, Loader2, AlertCircle } from "lucide-react";
import { addDays, format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const colorClasses = {
  blue: "from-blue-400 to-blue-500",
  purple: "from-purple-400 to-purple-500",
  green: "from-green-400 to-green-500",
  orange: "from-orange-400 to-orange-500",
  pink: "from-pink-400 to-pink-500",
  red: "from-red-400 to-red-500",
  indigo: "from-indigo-400 to-indigo-500",
  teal: "from-teal-400 to-teal-500",
};

export default function AddModuleDialog({ isOpen, onClose, projectId, onSuccess }) {
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [taskData, setTaskData] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const { data: modules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => base44.entities.Module.list('-created_date'),
    initialData: [],
  });

  const { data: templates } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => base44.entities.TaskTemplate.list('order'),
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const moduleTemplates = templates.filter(t => t.module_id === selectedModuleId);

  const handleModuleSelect = (moduleId) => {
    setSelectedModuleId(moduleId);
    // Corrected variable name from 'templates' to 'moduleTemplatesList' to avoid shadowing
    const moduleTemplatesList = templates.filter(t => t.module_id === moduleId);
    
    const today = new Date();
    let currentDate = today;
    
    const initialTaskData = moduleTemplatesList.map((template, index) => {
      const startDate = format(currentDate, 'yyyy-MM-dd');
      const endDate = format(addDays(currentDate, template.estimated_days || 1), 'yyyy-MM-dd');
      currentDate = addDays(currentDate, (template.estimated_days || 1) + 1);
      
      return {
        template_id: template.id,
        title: template.title,
        description: template.description,
        priority: template.priority,
        assigned_to: "",
        start_date: startDate,
        end_date: endDate
      };
    });
    
    setTaskData(initialTaskData);
  };

  const updateTaskField = (index, field, value) => {
    const newTaskData = [...taskData];
    newTaskData[index] = { ...newTaskData[index], [field]: value };
    setTaskData(newTaskData);
  };

  const handleCreateTasks = async () => {
    setIsCreating(true);
    try {
      const tasksToCreate = taskData.map(task => ({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        assigned_to: task.assigned_to || null,
        start_date: task.start_date,
        end_date: task.end_date,
        project_id: projectId,
        module_id: selectedModuleId,
        status: "pending"
      }));

      await base44.entities.Task.bulkCreate(tasksToCreate);
      
      onSuccess();
      handleClose();
    } catch (error) {
      alert('Erro ao criar tarefas: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedModuleId(null);
    setTaskData([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="w-6 h-6 text-purple-500" />
            Adicionar Módulo do Backlog
          </DialogTitle>
          <DialogDescription>
            Selecione um módulo e configure as datas e responsáveis das tarefas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Module Selection */}
          {!selectedModuleId ? (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Selecione um Módulo</Label>
              <div className="grid gap-3">
                {modules.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum módulo disponível</p>
                    <p className="text-sm">Crie módulos na página de Backlog</p>
                  </div>
                ) : (
                  modules.map(module => {
                    const moduleTemplateCount = templates.filter(t => t.module_id === module.id).length;
                    return (
                      <Card
                        key={module.id}
                        className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-purple-300"
                        onClick={() => handleModuleSelect(module.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[module.color]} flex items-center justify-center shadow-md`}>
                              <span className="text-white font-bold text-lg">{module.name[0]}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">{module.name}</h4>
                              <p className="text-sm text-slate-600 line-clamp-1">{module.description}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {moduleTemplateCount} tarefa{moduleTemplateCount !== 1 ? 's' : ''}
                                </Badge>
                                {module.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {module.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Selected Module Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[selectedModule.color]} flex items-center justify-center shadow-md`}>
                    <span className="text-white font-bold text-lg">{selectedModule.name[0]}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{selectedModule.name}</h4>
                    <p className="text-sm text-slate-600">{moduleTemplates.length} tarefas</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedModuleId(null)}
                >
                  Trocar Módulo
                </Button>
              </div>

              {/* Tasks Configuration */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Configure as Tarefas</Label>
                
                {taskData.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">Este módulo não possui tarefas</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {taskData.map((task, index) => (
                      <Card key={index} className="border-slate-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-slate-900 mb-1">{task.title}</h5>
                              {task.description && (
                                <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
                              )}
                              <Badge variant="outline" className="mt-2 text-xs">
                                Prioridade: {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor={`assigned-${index}`} className="text-xs font-medium flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Responsável
                              </Label>
                              <Select
                                value={task.assigned_to}
                                onValueChange={(value) => updateTaskField(index, 'assigned_to', value)}
                              >
                                <SelectTrigger id={`assigned-${index}`} className="h-9">
                                  <SelectValue placeholder="Selecionar">
                                    {task.assigned_to && users.find(u => u.email === task.assigned_to) ? (
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-5 h-5">
                                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                            {users.find(u => u.email === task.assigned_to)?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs">{users.find(u => u.email === task.assigned_to)?.full_name}</span>
                                      </div>
                                    ) : (
                                      "Nenhum"
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={null}>Nenhum</SelectItem>
                                  {users.map(user => (
                                    <SelectItem key={user.id} value={user.email}>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-5 h-5">
                                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                            {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="font-medium text-xs">{user.full_name}</div>
                                          <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor={`start-${index}`} className="text-xs font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Início
                              </Label>
                              <Input
                                id={`start-${index}`}
                                type="date"
                                value={task.start_date}
                                onChange={(e) => updateTaskField(index, 'start_date', e.target.value)}
                                className="h-9 text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor={`end-${index}`} className="text-xs font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Término
                              </Label>
                              <Input
                                id={`end-${index}`}
                                type="date"
                                value={task.end_date}
                                onChange={(e) => updateTaskField(index, 'end_date', e.target.value)}
                                min={task.start_date}
                                className="h-9 text-xs"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          {selectedModuleId && taskData.length > 0 && (
            <Button
              onClick={handleCreateTasks}
              disabled={isCreating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando {taskData.length} tarefa{taskData.length !== 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  Adicionar {taskData.length} Tarefa{taskData.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
