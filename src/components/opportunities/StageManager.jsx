import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Settings } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const colorOptions = [
  { value: "from-slate-400 to-slate-500", label: "Cinza", preview: "bg-slate-400" },
  { value: "from-blue-400 to-blue-500", label: "Azul", preview: "bg-blue-400" },
  { value: "from-purple-400 to-purple-500", label: "Roxo", preview: "bg-purple-400" },
  { value: "from-orange-400 to-orange-500", label: "Laranja", preview: "bg-orange-400" },
  { value: "from-green-400 to-green-500", label: "Verde", preview: "bg-green-400" },
  { value: "from-teal-400 to-teal-500", label: "Azul Claro", preview: "bg-teal-400" },
  { value: "from-red-400 to-red-500", label: "Vermelho", preview: "bg-red-400" },
  { value: "from-pink-400 to-pink-500", label: "Rosa", preview: "bg-pink-400" },
  { value: "from-indigo-400 to-indigo-500", label: "Índigo", preview: "bg-indigo-400" },
];

export default function StageManager({ isOpen, onClose, stages }) {
  const [editingStages, setEditingStages] = useState(stages || []);
  const [newStage, setNewStage] = useState({ key: "", label: "", color: colorOptions[1].value });
  const queryClient = useQueryClient();

  const createStageMutation = useMutation({
    mutationFn: (stageData) => base44.entities.OpportunityStage.create(stageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-stages'] });
      setNewStage({ key: "", label: "", color: colorOptions[1].value });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OpportunityStage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-stages'] });
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: (id) => base44.entities.OpportunityStage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-stages'] });
    },
  });

  const handleAddStage = () => {
    if (!newStage.key || !newStage.label) return;
    
    const maxOrder = editingStages.length > 0 
      ? Math.max(...editingStages.map(s => s.order || 0)) 
      : 0;

    createStageMutation.mutate({
      ...newStage,
      order: maxOrder + 1
    });
  };

  const handleDeleteStage = (stageId) => {
    if (window.confirm('Tem certeza que deseja excluir este estágio? As oportunidades neste estágio não serão excluídas.')) {
      deleteStageMutation.mutate(stageId);
    }
  };

  const handleUpdateOrder = (stageId, newOrder) => {
    const stage = editingStages.find(s => s.id === stageId);
    if (stage) {
      updateStageMutation.mutate({ id: stageId, data: { ...stage, order: newOrder } });
    }
  };

  const generateKey = (label) => {
    return label.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gerenciar Estágios do Funil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Stage */}
          <Card className="bg-slate-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Novo Estágio
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nome do Estágio</Label>
                    <Input
                      value={newStage.label}
                      onChange={(e) => setNewStage({
                        ...newStage,
                        label: e.target.value,
                        key: generateKey(e.target.value)
                      })}
                      placeholder="Ex: Prospecção"
                    />
                  </div>
                  <div>
                    <Label>Identificador (gerado automaticamente)</Label>
                    <Input
                      value={newStage.key}
                      onChange={(e) => setNewStage({ ...newStage, key: e.target.value })}
                      placeholder="Ex: prospecting"
                    />
                  </div>
                </div>
                <div>
                  <Label>Cor</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setNewStage({ ...newStage, color: color.value })}
                        className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                          newStage.color === color.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded ${color.preview}`} />
                        <span className="text-sm">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={handleAddStage}
                  disabled={!newStage.key || !newStage.label || createStageMutation.isPending}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Estágio
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Stages */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Estágios Atuais</h3>
            {editingStages.length === 0 ? (
              <Card className="bg-slate-50">
                <CardContent className="p-8 text-center">
                  <Settings className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">Nenhum estágio cadastrado ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {editingStages
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((stage, index) => {
                    const colorOption = colorOptions.find(c => c.value === stage.color) || colorOptions[0];
                    return (
                      <Card key={stage.id} className="border-slate-200">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-5 h-5 text-slate-400 cursor-move" />
                            <div className={`w-8 h-8 rounded ${colorOption.preview}`} />
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">{stage.label}</h4>
                              <p className="text-xs text-slate-500">{stage.key}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={index === 0}
                                onClick={() => handleUpdateOrder(stage.id, stage.order - 1.5)}
                                className="h-8 w-8"
                              >
                                ↑
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={index === editingStages.length - 1}
                                onClick={() => handleUpdateOrder(stage.id, stage.order + 1.5)}
                                className="h-8 w-8"
                              >
                                ↓
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteStage(stage.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}