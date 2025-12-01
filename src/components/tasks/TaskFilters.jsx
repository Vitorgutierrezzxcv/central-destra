import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User, CalendarDays, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TaskFilters({ onFilterChange, filters, projects, taskCount }) {
  // Removed internal useState for filters, it is now passed as a prop.

  // Buscar usuários de múltiplas fontes para garantir que funcione para todos
  const { data: currentUser } = useQuery({
    queryKey: ['currentUserFilter'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userProfiles } = useQuery({
    queryKey: ['userProfilesFilter'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  // Extrair responsáveis únicos das próprias tarefas (sempre funciona)
  const { data: allTasks } = useQuery({
    queryKey: ['allTasksForUsers'],
    queryFn: () => base44.entities.Task.list(),
    initialData: [],
  });

  // Combinar todas as fontes de usuários
  const users = React.useMemo(() => {
    const userMap = new Map();
    
    // Adicionar de UserProfiles
    userProfiles.forEach(profile => {
      if (profile.user_email) {
        userMap.set(profile.user_email, {
          id: profile.id,
          email: profile.user_email,
          display_name: profile.display_name || profile.full_name || profile.user_email.split('@')[0],
          full_name: profile.full_name || profile.user_email.split('@')[0]
        });
      }
    });
    
    // Adicionar usuário atual
    if (currentUser?.email && !userMap.has(currentUser.email)) {
      userMap.set(currentUser.email, {
        id: currentUser.id,
        email: currentUser.email,
        display_name: currentUser.display_name || currentUser.full_name || currentUser.email.split('@')[0],
        full_name: currentUser.full_name || currentUser.email.split('@')[0]
      });
    }
    
    // Extrair usuários únicos das tarefas existentes
    allTasks.forEach(task => {
      if (task.assigned_to && !userMap.has(task.assigned_to)) {
        userMap.set(task.assigned_to, {
          id: task.assigned_to,
          email: task.assigned_to,
          display_name: task.assigned_to.split('@')[0],
          full_name: task.assigned_to.split('@')[0]
        });
      }
      if (task.created_by && !userMap.has(task.created_by)) {
        userMap.set(task.created_by, {
          id: task.created_by,
          email: task.created_by,
          display_name: task.created_by.split('@')[0],
          full_name: task.created_by.split('@')[0]
        });
      }
    });
    
    return Array.from(userMap.values());
  }, [userProfiles, currentUser, allTasks]);

  const loadingUsers = !currentUser;

  // Helper to get date range values based on a shortcut string
  const getDateRangeValues = (range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    let from, to;

    switch (range) {
      case "today":
        from = today;
        to = new Date(today);
        to.setHours(23, 59, 59, 999); // End of today
        break;
      case "this_week":
        from = new Date(today);
        from.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(from.getDate() + 6); // End of current week (Saturday)
        to.setHours(23, 59, 59, 999);
        break;
      case "this_month":
        from = new Date(today.getFullYear(), today.getMonth(), 1); // Start of current month
        from.setHours(0, 0, 0, 0);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of current month
        to.setHours(23, 59, 59, 999);
        break;
      case "all":
      default:
        from = undefined;
        to = undefined;
        break;
    }
    return { dateFrom: from, dateTo: to };
  };

  // Modified handleFilterChange to use filters from props and call onFilterChange
  const handleFilterChange = (key, value) => {
    let newFilters = { ...filters }; // Use filters from props

    if (key === "dateRange") {
      newFilters.dateRange = value;
      if (value !== "custom") {
        // If a predefined range is selected, calculate and set dateFrom/dateTo
        const { dateFrom, dateTo } = getDateRangeValues(value);
        newFilters.dateFrom = dateFrom;
        newFilters.dateTo = dateTo;
      }
      // If "custom" is selected, dateFrom/dateTo remain as they are or are undefined
    } else if (key === "dateFrom" || key === "dateTo") {
      newFilters[key] = value;
      // If either dateFrom or dateTo is explicitly set (not undefined), it's a custom range
      if (newFilters.dateFrom !== undefined || newFilters.dateTo !== undefined) {
        newFilters.dateRange = "custom";
      } else {
        // If both are cleared/undefined, revert dateRange to "all"
        newFilters.dateRange = "all";
      }
    } else {
      newFilters[key] = value;
    }

    onFilterChange(newFilters); // Call prop callback
  };

  const getUserDisplayName = (user) => {
    return user.display_name || user.full_name || user.email;
  };

  // Memoized label for the date range select trigger
  const selectedDateRangeLabel = React.useMemo(() => {
    const { dateRange, dateFrom, dateTo } = filters;
    if (dateRange === "all") return "Todos os prazos";
    if (dateRange === "today") return "Hoje";
    if (dateRange === "this_week") return "Esta semana";
    if (dateRange === "this_month") return "Este mês";
    if (dateRange === "custom") {
      if (dateFrom && dateTo) {
        return `${format(dateFrom, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateTo, "dd/MM/yyyy", { locale: ptBR })}`;
      } else if (dateFrom) {
        return `A partir de ${format(dateFrom, "dd/MM/yyyy", { locale: ptBR })}`;
      } else if (dateTo) {
        return `Até ${format(dateTo, "dd/MM/yyyy", { locale: ptBR })}`;
      }
      return "Período personalizado";
    }
    return "Prazo";
  }, [filters.dateRange, filters.dateFrom, filters.dateTo]);


  return (
    <div className="bg-white rounded-xl p-4 md:p-6 mb-6 border border-[#EAEAEA]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#456C8D]" />
          <h3 className="font-medium text-[#131A20] text-sm md:text-base">Filtros</h3>
        </div>
        <Badge variant="secondary" className="bg-[#EAEAEA] text-[#456C8D] text-xs md:text-sm">
          {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'}
        </Badge>
      </div>

      {/* Flexible container for filters, adapted to new grid layout */}
      <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-5 md:gap-4">
        {/* Search Input - takes more space on larger screens */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Buscar tarefas..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-9 border-[#EAEAEA] h-10 w-full"
          />
        </div>

        {/* Date Range Select */}
        <Select
          value={filters.dateRange}
          onValueChange={(value) => handleFilterChange("dateRange", value)}
        >
          <SelectTrigger className="border-[#EAEAEA] h-10 w-full">
            <CalendarDays className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Prazo">
                {selectedDateRangeLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os prazos</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="this_week">Esta semana</SelectItem>
            <SelectItem value="this_month">Este mês</SelectItem>
            <SelectItem value="custom">Período personalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Pickers for Custom Range, conditionally rendered */}
        {filters.dateRange === "custom" && (
            <>
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className="flex h-10 w-full items-center justify-between rounded-md border border-[#EAEAEA] bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-[#456C8D] focus:outline-none focus:ring-2 focus:ring-[#6FA6FF] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                        >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {filters.dateFrom ? (
                                format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                                <span>Data Início</span>
                            )}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={filters.dateFrom}
                            onSelect={(date) => handleFilterChange("dateFrom", date)}
                            initialFocus
                            locale={ptBR}
                        />
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className="flex h-10 w-full items-center justify-between rounded-md border border-[#EAEAEA] bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-[#456C8D] focus:outline-none focus:ring-2 focus:ring-[#6FA6FF] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                        >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {filters.dateTo ? (
                                format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                                <span>Data Fim</span>
                            )}
                            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={filters.dateTo}
                            onSelect={(date) => handleFilterChange("dateTo", date)}
                            initialFocus
                            locale={ptBR}
                        />
                    </PopoverContent>
                </Popover>
            </>
        )}

        {/* Status Select */}
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="border-[#EAEAEA] h-10 w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="overdue">Atrasadas</SelectItem> {/* Added new item */}
          </SelectContent>
        </Select>

        {/* Priority Select */}
        <Select
          value={filters.priority}
          onValueChange={(value) => handleFilterChange("priority", value)}
        >
          <SelectTrigger className="border-[#EAEAEA] h-10 w-full">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>

        {/* Project Select */}
        <Select
          value={filters.project}
          onValueChange={(value) => handleFilterChange("project", value)}
        >
          <SelectTrigger className="border-[#EAEAEA] h-10 w-full">
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

        {/* AssignedTo Select */}
        <Select
          value={filters.assignedTo}
          onValueChange={(value) => handleFilterChange("assignedTo", value)}
        >
          <SelectTrigger className="border-[#EAEAEA] h-10 w-full">
            <SelectValue placeholder="Responsável">
              {filters.assignedTo === "all" ? (
                "Todos Responsáveis"
              ) : filters.assignedTo === "unassigned" ? (
                "Sem responsável"
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="truncate">{getUserDisplayName(users.find(u => u.email === filters.assignedTo) || {})}</span>
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
                    <span className="truncate">{getUserDisplayName(user)}</span>
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