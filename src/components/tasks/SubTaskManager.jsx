import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, X, CheckCircle2, Circle, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function SubTaskManager({ subtasks, onChange, inheritedData = {} }) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [expandedSubtasks, setExpandedSubtasks] = useState(new Set());

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: userProfiles } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  const uniqueUsers = React.useMemo(() => {
    const userMap = new Map();
    
    userProfiles.forEach(profile => {
      if (profile.user_email) {
        userMap.set(profile.user_email, {
          id: profile.id,
          user_email: profile.user_email,
          display_name: profile.display_name || profile.full_name || profile.user_email.split('@')[0],
          full_name: profile.full_name || profile.user_email.split('@')[0]
        });
      }
    });
    
    users.forEach(user => {
      if (user.email && !userMap.has(user.email)) {
        userMap.set(user.email, {
          id: user.id,
          user_email: user.email,
          display_name: user.display_name || user.full_name || user.email.split('@')[0],
          full_name: user.full_name || user.email.split('@')[0]
        });
      }
    });
    
    return Array.from(userMap.values());
  }, [users, userProfiles]);

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onChange([
        ...subtasks,
        {
          id: `temp-${Date.now()}`,
          title: newSubtaskTitle,
          status: 'pending',
          priority: inheritedData.priority || 'medium',
          assigned_to: inheritedData.assigned_to || null,
          start_date: inheritedData.start_date || "",
          end_date: inheritedData.end_date || ""
        }
      ]);
      setNewSubtaskTitle("");
    }
  };

  const handleUpdateSubtask = (index, field, value) => {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleToggleSubtask = (index) => {
    const updated = [...subtasks];
    updated[index].status = updated[index].status === 'completed' ? 'pending' : 'completed';
    onChange(updated);
  };

  const handleRemoveSubtask = (index) => {
    onChange(subtasks.filter((_, i) => i !== index));
  };

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedSubtasks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSubtasks(newExpanded);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const completedCount = subtasks.filter(st => st.status === 'completed').length;

  const getUserDisplayName = (userProfile) => {
    return userProfile.display_name || userProfile.full_name || userProfile.user_email;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-900">
          Subtarefas
        </label>
        {subtasks.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {completedCount}/{subtasks.length} concluídas
          </Badge>
        )}
      </div>

      {subtasks.length > 0 && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-3 space-y-2">
            {subtasks.map((subtask, index) => {
              const isExpanded = expandedSubtasks.has(index);
              
              return (
                <Collapsible key={subtask.id || index} open={isExpanded} onOpenChange={() => toggleExpanded(index)}>
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2 p-2 group hover:bg-slate-50 transition-colors">
                      <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(index)}
                        className="flex-shrink-0"
                      >
                        {subtask.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          subtask.status === 'completed'
                            ? "line-through text-slate-500"
                            : "text-slate-900"
                        }`}
                      >
                        {subtask.title}
                      </span>
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSubtask(index)}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <CollapsibleContent>
                      <div className="p-3 border-t border-slate-200 space-y-3 bg-slate-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Prioridade</Label>
                            <Select
                              value={subtask.priority}
                              onValueChange={(value) => handleUpdateSubtask(index, 'priority', value)}
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
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Responsável</Label>
                            <Select
                              value={subtask.assigned_to || ""}
                              onValueChange={(value) => handleUpdateSubtask(index, 'assigned_to', value === "none" ? null : value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Atribuir" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhum</SelectItem>
                                {uniqueUsers.map(userProfile => (
                                  <SelectItem key={userProfile.user_email} value={userProfile.user_email}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-4 h-4">
                                        <AvatarFallback className="text-[8px] bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                          {getUserDisplayName(userProfile).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs truncate">{getUserDisplayName(userProfile)}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Data de Início</Label>
                            <Input
                              type="date"
                              value={subtask.start_date || ""}
                              onChange={(e) => handleUpdateSubtask(index, 'start_date', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Data de Término</Label>
                            <Input
                              type="date"
                              value={subtask.end_date || ""}
                              onChange={(e) => handleUpdateSubtask(index, 'end_date', e.target.value)}
                              min={subtask.start_date}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Adicionar subtarefa..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          className="h-9 text-sm"
        />
        <Button
          type="button"
          onClick={handleAddSubtask}
          disabled={!newSubtaskTitle.trim()}
          size="sm"
          variant="outline"
          className="h-9 px-3"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}