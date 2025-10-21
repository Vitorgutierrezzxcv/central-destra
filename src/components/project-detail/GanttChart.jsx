import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const statusColors = {
  pending: "#EAB308",
  in_progress: "#3B82F6",
  completed: "#10B981"
};

const statusLabels = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  completed: "Concluída"
};

export default function GanttChart({ tasks, projectColor }) {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Calendar className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Nenhuma tarefa para exibir</h3>
        <p>Adicione tarefas com datas de início e término para visualizar o cronograma</p>
      </div>
    );
  }

  const tasksWithDates = tasks.filter(t => t.start_date && t.end_date);

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Calendar className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Adicione datas às tarefas</h3>
        <p>Para visualizar o gráfico de Gantt, as tarefas precisam ter datas de início e término</p>
      </div>
    );
  }

  // Get date range
  const startDates = tasksWithDates.map(t => new Date(t.start_date));
  const endDates = tasksWithDates.map(t => new Date(t.end_date));
  const minDate = new Date(Math.min(...startDates));
  const maxDate = new Date(Math.max(...endDates));
  
  const totalDays = differenceInDays(maxDate, minDate) + 1;

  // Sort tasks by start date
  const sortedTasks = [...tasksWithDates].sort((a, b) => 
    new Date(a.start_date) - new Date(b.start_date)
  );

  const getTaskPosition = (startDate) => {
    const daysDiff = differenceInDays(new Date(startDate), minDate);
    return (daysDiff / totalDays) * 100;
  };

  const getTaskWidth = (startDate, endDate) => {
    const duration = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    return (duration / totalDays) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Cronograma do Projeto
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-slate-600">Data de início: </span>
            <span className="font-semibold">{format(minDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
          <div>
            <span className="text-slate-600">Data de término: </span>
            <span className="font-semibold">{format(maxDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.pending }} />
            <span className="text-slate-600">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.in_progress }} />
            <span className="text-slate-600">Em Andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.completed }} />
            <span className="text-slate-600">Concluída</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Timeline Header */}
        <div className="flex border-b border-slate-200">
          <div className="w-72 p-4 bg-slate-50 font-semibold text-slate-900 border-r border-slate-200">
            Tarefa
          </div>
          <div className="flex-1 relative h-12 bg-slate-50">
            <div className="absolute inset-0 flex">
              {Array.from({ length: Math.min(totalDays, 30) }, (_, i) => {
                const date = new Date(minDate);
                date.setDate(date.getDate() + Math.floor((i / 30) * totalDays));
                return (
                  <div 
                    key={i}
                    className="flex-1 border-r border-slate-200 px-2 py-3 text-xs text-slate-600 text-center"
                  >
                    {format(date, 'dd/MM', { locale: ptBR })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="divide-y divide-slate-200">
          {sortedTasks.map((task) => {
            const leftPosition = getTaskPosition(task.start_date);
            const width = getTaskWidth(task.start_date, task.end_date);
            const duration = differenceInDays(new Date(task.end_date), new Date(task.start_date)) + 1;
            const assignedUser = users.find(u => u.email === task.assigned_to);

            return (
              <div key={task.id} className="flex hover:bg-slate-50 transition-colors">
                <div className="w-72 p-4 border-r border-slate-200">
                  <div className="font-medium text-slate-900 line-clamp-1 mb-1">
                    {task.title}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {format(parseISO(task.start_date), 'dd/MM', { locale: ptBR })} - {format(parseISO(task.end_date), 'dd/MM', { locale: ptBR })}
                    </span>
                    {assignedUser && (
                      <div className="flex items-center gap-1">
                        <Avatar className="w-4 h-4">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {assignedUser.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[80px]">{assignedUser.full_name?.split(' ')[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 relative p-4">
                  <div className="relative h-8">
                    <div
                      className="absolute h-full rounded-lg flex items-center px-3 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                      style={{
                        left: `${leftPosition}%`,
                        width: `${width}%`,
                        backgroundColor: statusColors[task.status],
                        minWidth: '60px'
                      }}
                    >
                      <span className="text-xs font-medium text-white truncate">
                        {duration} {duration === 1 ? 'dia' : 'dias'}
                      </span>
                      
                      {/* Tooltip on hover */}
                      <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-10">
                        <div className="font-semibold mb-1">{task.title}</div>
                        <div>Status: {statusLabels[task.status]}</div>
                        <div>Duração: {duration} {duration === 1 ? 'dia' : 'dias'}</div>
                        {assignedUser && <div>Responsável: {assignedUser.full_name}</div>}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> O gráfico de Gantt mostra a linha do tempo e duração de cada tarefa. 
          Passe o mouse sobre as barras para ver mais detalhes.
        </p>
      </div>
    </div>
  );
}