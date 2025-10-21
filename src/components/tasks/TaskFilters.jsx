import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TaskFilters({ onFilterChange, projects, taskCount }) {
  const [filters, setFilters] = React.useState({
    status: "all",
    priority: "all",
    project: "all",
    assignedTo: "all",
    search: ""
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 md:p-6 mb-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filtros</h3>
        </div>
        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
          {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Buscar tarefas..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-9 border-slate-200"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="border-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.priority}
          onValueChange={(value) => handleFilterChange("priority", value)}
        >
          <SelectTrigger className="border-slate-200">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.project}
          onValueChange={(value) => handleFilterChange("project", value)}
        >
          <SelectTrigger className="border-slate-200">
            <SelectValue placeholder="Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Projetos</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.assignedTo}
          onValueChange={(value) => handleFilterChange("assignedTo", value)}
        >
          <SelectTrigger className="border-slate-200">
            <SelectValue placeholder="Responsável">
              {filters.assignedTo === "all" ? (
                "Todos Responsáveis"
              ) : filters.assignedTo === "unassigned" ? (
                "Sem responsável"
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {users.find(u => u.email === filters.assignedTo)?.full_name || "Responsável"}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Responsáveis</SelectItem>
            <SelectItem value="unassigned">Sem responsável</SelectItem>
            {loadingUsers ? (
              <SelectItem value={null} disabled>Carregando...</SelectItem>
            ) : (
              users.map(user => (
                <SelectItem key={user.id} value={user.email}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user.full_name}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}