import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";

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
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Calendar className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Nenhuma tarefa para exibir</h3>
        <p>Adicione tarefas com datas de agendamento para visualizar o cronograma</p>
      </div>
    );
  }

  const tasksWithDates = tasks.filter(t => t.scheduled_date);

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Calendar className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Adicione datas às tarefas</h3>
        <p>Para visualizar o gráfico de Gantt, as tarefas precisam ter datas de agendamento</p>
      </div>
    );
  }

  // Get date range
  const dates = tasksWithDates.map(t => new Date(t.scheduled_date));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  // Prepare data for Gantt chart
  const chartData = tasksWithDates
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .map(task => ({
      name: task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title,
      fullName: task.title,
      date: new Date(task.scheduled_date).getTime(),
      dateLabel: format(parseISO(task.scheduled_date), 'dd/MM/yyyy', { locale: ptBR }),
      status: task.status,
      statusLabel: statusLabels[task.status],
      priority: task.priority,
      value: 1
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200">
          <p className="font-semibold text-slate-900 mb-2">{data.fullName}</p>
          <p className="text-sm text-slate-600">Data: {data.dateLabel}</p>
          <p className="text-sm text-slate-600">Status: {data.statusLabel}</p>
          <p className="text-sm text-slate-600 capitalize">Prioridade: {data.priority}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Cronograma do Projeto
        </h3>
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

      <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 60)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis 
            type="number" 
            domain={[minDate.getTime(), maxDate.getTime()]}
            tickFormatter={(timestamp) => format(new Date(timestamp), 'dd/MM', { locale: ptBR })}
            stroke="#64748B"
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={150}
            stroke="#64748B"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="date" radius={[8, 8, 8, 8]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={statusColors[entry.status]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> O gráfico de Gantt mostra a linha do tempo das tarefas. 
          Cada barra representa uma tarefa e sua cor indica o status atual.
        </p>
      </div>
    </div>
  );
}