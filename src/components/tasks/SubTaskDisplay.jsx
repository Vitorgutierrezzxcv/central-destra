import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SubTaskDisplay({ taskId }) {
  const queryClient = useQueryClient();

  const { data: subtasks } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => base44.entities.Task.filter({ parent_task_id: taskId }),
    initialData: [],
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => base44.entities.Task.update(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    },
  });

  const handleToggleSubtask = (subtask) => {
    const newStatus = subtask.status === 'completed' ? 'pending' : 'completed';
    updateTaskMutation.mutate({
      id: subtask.id,
      taskData: { ...subtask, status: newStatus }
    });
  };

  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  const completedCount = subtasks.filter(st => st.status === 'completed').length;
  const progress = (completedCount / subtasks.length) * 100;

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs bg-slate-100">
          {completedCount}/{subtasks.length} subtarefas
        </Badge>
        <Progress value={progress} className="h-1.5 flex-1" />
      </div>
      <div className="space-y-1 pl-2">
        {subtasks.map(subtask => (
          <button
            key={subtask.id}
            onClick={() => handleToggleSubtask(subtask)}
            className="flex items-center gap-2 text-sm hover:bg-slate-50 w-full p-1.5 rounded transition-colors text-left"
          >
            {subtask.status === 'completed' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
            <span className={subtask.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-700'}>
              {subtask.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}