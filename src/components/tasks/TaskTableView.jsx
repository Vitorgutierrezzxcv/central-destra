
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
    color: "bg-yellow-100 text-yellow-700 border-yellow-200"
  },
  in_progress: {
    icon: ArrowUpCircle,
    label: "Em Andamento",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  completed: {
    icon: CheckCircle2,
    label: "Concluída",
    color: "bg-green-100 text-green-700 border-green-200"
  }
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-100 text-slate-700" },
  medium: { label: "Média", color: "bg-blue-100 text-blue-700" },
  high: { label: "Alta", color: "bg-red-100 text-red-700" }
};

export default function TaskTableView({ tasks, projects, onEdit, onDelete, onStatusChange }) {
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
      <div className="text-center py-16 text-slate-500 bg-white rounded-xl">
        <Circle className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Nenhuma tarefa encontrada</h3>
        <p>Adicione sua primeira tarefa para começar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold text-slate-900 w-[40px]">Status</TableHead>
              <TableHead className="font-bold text-slate-900 min-w-[200px]">Tarefa</TableHead>
              <TableHead className="font-bold text-slate-900 hidden md:table-cell">Projeto</TableHead>
              <TableHead className="font-bold text-slate-900 hidden lg:table-cell">Responsável</TableHead>
              <TableHead className="font-bold text-slate-900 hidden sm:table-cell">Prioridade</TableHead>
              <TableHead className="font-bold text-slate-900 hidden xl:table-cell">Início</TableHead>
              <TableHead className="font-bold text-slate-900 hidden xl:table-cell">Término</TableHead>
              <TableHead className="font-bold text-slate-900 w-[100px] text-right">Ações</TableHead>
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
                <TableRow key={task.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="hover:opacity-70 transition-opacity">
                          <StatusIcon className={`w-5 h-5 ${status.color.includes('yellow') ? 'text-yellow-600' : status.color.includes('blue') ? 'text-blue-600' : 'text-green-600'}`} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onStatusChange(task, "pending")}>
                          <Circle className="w-4 h-4 mr-2 text-yellow-600" />
                          Pendente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(task, "in_progress")}>
                          <ArrowUpCircle className="w-4 h-4 mr-2 text-blue-600" />
                          Em Andamento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(task, "completed")}>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                          Concluída
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className={`font-semibold text-slate-900 ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-slate-600 line-clamp-1 mt-1">
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
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-slate-700">{assignedUserName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Não atribuída</span>
                    )}
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className={`text-xs ${priority.color}`}>
                      <Flag className="w-3 h-3 mr-1" />
                      {priority.label}
                    </Badge>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell text-sm text-slate-600">
                    {task.start_date ? new Date(task.start_date).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>

                  <TableCell className="hidden xl:table-cell text-sm text-slate-600">
                    {task.end_date ? new Date(task.end_date).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(task)}
                        className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(task.id)}
                        className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
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
