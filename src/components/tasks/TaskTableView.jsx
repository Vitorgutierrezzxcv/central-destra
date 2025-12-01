import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { sortTasksByUrgency } from "./taskSortUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Circle, ArrowUpCircle, CheckCircle2, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  pending: {
    icon: Circle,
    label: "Pendente",
    color: "bg-[#EAEAEA] text-[#456C8D] border-[#EAEAEA]",
    iconColor: "text-[#456C8D]"
  },
  in_progress: {
    icon: ArrowUpCircle,
    label: "Em Andamento",
    color: "bg-[#6FA6FF]/10 text-[#6FA6FF] border-[#6FA6FF]/30",
    iconColor: "text-[#6FA6FF]"
  },
  completed: {
    icon: CheckCircle2,
    label: "Concluída",
    color: "bg-[#131A20]/10 text-[#131A20] border-[#131A20]/30",
    iconColor: "text-[#131A20]"
  }
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-[#EAEAEA] text-[#456C8D]" },
  medium: { label: "Média", color: "bg-[#6FA6FF]/10 text-[#6FA6FF]" },
  high: { label: "Alta", color: "bg-red-100 text-red-600" }
};

export default function TaskTableView({ tasks: unsortedTasks, projects, onEdit, onDelete, onStatusChange }) {
  const tasks = sortTasksByUrgency(unsortedTasks);
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

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

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-[#456C8D] bg-white rounded-xl border border-[#EAEAEA]">
        <Circle className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-[#131A20] mb-2">Nenhuma tarefa encontrada</h3>
        <p>Adicione sua primeira tarefa para começar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#EAEAEA] overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#EAEAEA]">
              <TableHead className="font-medium text-[#131A20] w-[40px]">Status</TableHead>
              <TableHead className="font-medium text-[#131A20] min-w-[200px]">Tarefa</TableHead>
              <TableHead className="font-medium text-[#131A20] hidden md:table-cell">Projeto</TableHead>
              <TableHead className="font-medium text-[#131A20] hidden lg:table-cell">Responsável</TableHead>
              <TableHead className="font-medium text-[#131A20] hidden sm:table-cell">Prioridade</TableHead>
              <TableHead className="font-medium text-[#131A20] hidden xl:table-cell">Início</TableHead>
              <TableHead className="font-medium text-[#131A20] hidden xl:table-cell">Término</TableHead>
              <TableHead className="font-medium text-[#131A20] w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const project = projects.find(p => p.id === task.project_id);
              const status = statusConfig[task.status];
              const StatusIcon = status.icon;
              const priority = priorityConfig[task.priority];
              const assignedUserName = getUserDisplayName(task.assigned_to);
              const userInitials = getUserInitials(task.assigned_to);

              return (
                <TableRow key={task.id} className="hover:bg-[#EAEAEA]/30 transition-colors">
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="hover:opacity-70 transition-opacity">
                          <StatusIcon className={`w-5 h-5 ${status.iconColor}`} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onStatusChange(task, "pending")}>
                          <Circle className="w-4 h-4 mr-2 text-[#456C8D]" />
                          Pendente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(task, "in_progress")}>
                          <ArrowUpCircle className="w-4 h-4 mr-2 text-[#6FA6FF]" />
                          Em Andamento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(task, "completed")}>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-[#131A20]" />
                          Concluída
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className={`font-semibold text-[#131A20] ${task.status === 'completed' ? 'line-through text-[#456C8D]' : ''}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-[#456C8D] line-clamp-1 mt-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {project && (
                      <Badge variant="outline" className="text-xs">
                        {project.name}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    {task.assigned_to && assignedUserName ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-[#6FA6FF] text-white">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-[#131A20]">{assignedUserName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-[#456C8D]">Não atribuída</span>
                    )}
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className={`text-xs ${priority.color}`}>
                      <Flag className="w-3 h-3 mr-1" />
                      {priority.label}
                    </Badge>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell text-sm text-[#456C8D]">
                    {task.start_date ? task.start_date.split('-').reverse().join('/') : '-'}
                  </TableCell>

                  <TableCell className="hidden xl:table-cell text-sm text-[#456C8D]">
                    {task.end_date ? task.end_date.split('-').reverse().join('/') : '-'}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(task)}
                        className="h-8 w-8 text-[#456C8D] hover:text-[#6FA6FF] hover:bg-[#6FA6FF]/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(task.id)}
                        className="h-8 w-8 text-[#456C8D] hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}