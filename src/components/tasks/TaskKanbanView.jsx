import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, Flag, Clock, Circle, ArrowUpCircle, CheckCircle2 } from "lucide-react";

const statusColumns = {
  pending: {
    title: "Pendente",
    icon: Circle,
    color: "bg-[#EAEAEA]",
    borderColor: "border-[#EAEAEA]",
    iconColor: "text-[#456C8D]"
  },
  in_progress: {
    title: "Em Andamento",
    icon: ArrowUpCircle,
    color: "bg-[#6FA6FF]/10",
    borderColor: "border-[#6FA6FF]",
    iconColor: "text-[#6FA6FF]"
  },
  completed: {
    title: "Concluída",
    icon: CheckCircle2,
    color: "bg-[#131A20]/10",
    borderColor: "border-[#131A20]",
    iconColor: "text-[#131A20]"
  }
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-[#EAEAEA] text-[#456C8D]" },
  medium: { label: "Média", color: "bg-[#6FA6FF]/10 text-[#6FA6FF]" },
  high: { label: "Alta", color: "bg-red-100 text-red-600" }
};

export default function TaskKanbanView({ tasks, projects, onEdit, onDelete, onStatusChange }) {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const task = tasks.find(t => t.id === taskId);

    if (task && task.status !== newStatus) {
      onStatusChange(task, newStatus);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const getUserDisplayName = (email) => {
    if (!email) return null;
    const user = users.find(u => u.email === email);
    if (!user) return email.split('@')[0];
    return user.display_name || user.full_name || email.split('@')[0];
  };

  const getUserInitials = (email) => {
    if (!email) return '?';
    const user = users.find(u => u.email === email);
    const name = user ? (user.display_name || user.full_name || email) : email;
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {Object.entries(statusColumns).map(([status, config]) => {
          const StatusIcon = config.icon;
          const statusTasks = getTasksByStatus(status);

          return (
            <div key={status} className="flex flex-col">
              <div className={`${config.color} rounded-t-xl md:rounded-t-2xl p-3 md:p-4 border-b-2 ${config.borderColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 md:w-5 md:h-5 ${config.iconColor}`} />
                    <h3 className="font-bold text-slate-900 text-sm md:text-base">{config.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/80 text-xs">
                    {statusTasks.length}
                  </Badge>
                </div>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 bg-white rounded-b-xl p-3 md:p-4 space-y-3 min-h-[200px] transition-colors border border-t-0 border-[#EAEAEA] ${
                      snapshot.isDraggingOver ? 'bg-[#EAEAEA]/30' : ''
                    }`}
                  >
                    {statusTasks.map((task, index) => {
                      const project = projects.find(p => p.id === task.project_id);
                      const priority = priorityConfig[task.priority];
                      const assignedUserName = getUserDisplayName(task.assigned_to);
                      const userInitials = getUserInitials(task.assigned_to);

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-move hover:shadow-lg transition-all ${
                                snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105' : ''
                              }`}
                            >
                              <CardContent className="p-3 md:p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h4 className="font-semibold text-[#131A20] text-sm md:text-base line-clamp-2 flex-1">
                                    {task.title}
                                  </h4>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(task);
                                      }}
                                      className="h-7 w-7 text-[#456C8D] hover:text-[#6FA6FF] hover:bg-[#6FA6FF]/10"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(task.id);
                                      }}
                                      className="h-7 w-7 text-[#456C8D] hover:text-red-500 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {task.description && (
                                  <p className="text-xs md:text-sm text-[#456C8D] mb-3 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    {project && (
                                      <Badge variant="outline" className="text-xs">
                                        {project.name}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className={`text-xs ${priority.color}`}>
                                      <Flag className="w-3 h-3 mr-1" />
                                      {priority.label}
                                    </Badge>
                                  </div>

                                  {(task.start_date || task.end_date) && (
                                    <div className="flex flex-wrap gap-1.5 text-xs text-[#456C8D]">
                                      {task.start_date && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {task.start_date.split('-').reverse().slice(0, 2).join('/')}
                                        </span>
                                      )}
                                      {task.end_date && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {task.end_date.split('-').reverse().slice(0, 2).join('/')}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {task.assigned_to && assignedUserName && (
                                    <div className="flex items-center gap-2 bg-[#EAEAEA] px-2 py-1 rounded-full w-fit">
                                      <Avatar className="w-4 h-4">
                                        <AvatarFallback className="text-[8px] bg-[#6FA6FF] text-white">
                                          {userInitials}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs font-medium text-[#131A20]">{assignedUserName}</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    {statusTasks.length === 0 && (
                      <div className="text-center py-8 text-[#456C8D]">
                        <StatusIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma tarefa</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}