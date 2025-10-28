import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, CheckCircle2, Circle, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SubTaskManager({ subtasks, onChange }) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onChange([
        ...subtasks,
        {
          id: `temp-${Date.now()}`,
          title: newSubtaskTitle,
          completed: false
        }
      ]);
      setNewSubtaskTitle("");
    }
  };

  const handleToggleSubtask = (index) => {
    const updated = [...subtasks];
    updated[index].completed = !updated[index].completed;
    onChange(updated);
  };

  const handleRemoveSubtask = (index) => {
    onChange(subtasks.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const completedCount = subtasks.filter(st => st.completed).length;

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

      {/* Lista de subtarefas */}
      {subtasks.length > 0 && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-3 space-y-2">
            {subtasks.map((subtask, index) => (
              <div
                key={subtask.id || index}
                className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 group hover:border-slate-300 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => handleToggleSubtask(index)}
                  className="flex-shrink-0"
                >
                  {subtask.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    subtask.completed
                      ? "line-through text-slate-500"
                      : "text-slate-900"
                  }`}
                >
                  {subtask.title}
                </span>
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
            ))}
          </CardContent>
        </Card>
      )}

      {/* Input para nova subtarefa */}
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