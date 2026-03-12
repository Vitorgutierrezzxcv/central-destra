import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Download, TrendingUp, AlertCircle, Users, CheckCircle2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PerformanceReports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: allTasks = [] } = useQuery({
    queryKey: ["all_tasks_report"],
    queryFn: async () => await base44.entities.Task.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ["all_users"],
    queryFn: async () => await base44.entities.User.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["all_projects_report"],
    queryFn: async () => await base44.entities.Project.list()
  });

  // Filtrar tarefas do mês selecionado
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const tasksInMonth = allTasks.filter(task => {
    if (!task.created_date) return false;
    const createdDate = parseISO(task.created_date);
    return isAfter(createdDate, monthStart) && isBefore(createdDate, monthEnd);
  });

  // Calcular métricas gerais
  const completedTasks = tasksInMonth.filter(t => t.status === "completed").length;
  const totalTasks = tasksInMonth.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tarefas atrasadas
  const delayedTasks = tasksInMonth.filter(task => {
    if (!task.end_date || task.status === "completed") return false;
    const endDate = parseISO(task.end_date);
    return isBefore(endDate, new Date());
  });

  // Agrupar por colaborador
  const tasksByAssignee = tasksInMonth.reduce((acc, task) => {
    const email = task.assigned_to || "Não atribuído";
    if (!acc[email]) {
      acc[email] = {
        email,
        total: 0,
        completed: 0,
        delayed: 0,
        inProgress: 0,
        pending: 0
      };
    }
    acc[email].total += 1;
    if (task.status === "completed") acc[email].completed += 1;
    if (task.status === "in_progress") acc[email].inProgress += 1;
    if (task.status === "pending") acc[email].pending += 1;
    
    if (task.end_date && task.status !== "completed" && isBefore(parseISO(task.end_date), new Date())) {
      acc[email].delayed += 1;
    }
    return acc;
  }, {});

  const assigneeMetrics = Object.values(tasksByAssignee).map(assignee => ({
    ...assignee,
    productivity: assignee.total > 0 ? Math.round((assignee.completed / assignee.total) * 100) : 0
  }));

  // Dados para gráficos
  const completionChartData = [
    { name: "Concluídas", value: completedTasks, fill: "#10b981" },
    { name: "Em Andamento", value: tasksInMonth.filter(t => t.status === "in_progress").length, fill: "#3b82f6" },
    { name: "Pendentes", value: tasksInMonth.filter(t => t.status === "pending").length, fill: "#f59e0b" }
  ];

  const productivityChartData = assigneeMetrics
    .sort((a, b) => b.productivity - a.productivity)
    .slice(0, 10)
    .map(a => ({
      name: a.email.split("@")[0],
      productivity: a.productivity,
      completed: a.completed,
      total: a.total
    }));

  const generatePDF = async () => {
    setPdfLoading(true);
    try {
      const response = await fetch("/api/functions/generatePerformanceReport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: format(selectedMonth, "yyyy-MM"),
          tasksInMonth: tasksInMonth.length,
          completedTasks,
          completionRate,
          delayedTasks: delayedTasks.length,
          assigneeMetrics
        })
      });

      if (!response.ok) throw new Error("Erro ao gerar PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-performance-${format(selectedMonth, "yyyy-MM")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              Relatórios de Performance
            </h1>
            <p className="text-slate-600 mt-1">Análise de produtividade e indicadores de atraso</p>
          </div>
          <div className="flex gap-3">
            <input
              type="month"
              value={format(selectedMonth, "yyyy-MM")}
              onChange={(e) => setSelectedMonth(new Date(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
            <Button onClick={generatePDF} disabled={pdfLoading} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total de Tarefas</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{totalTasks}</p>
                </div>
                <Calendar className="w-12 h-12 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Taxa de Conclusão</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{completionRate}%</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Tarefas Atrasadas</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{delayedTasks.length}</p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-100" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Colaboradores</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{Object.keys(tasksByAssignee).length}</p>
                </div>
                <Users className="w-12 h-12 text-slate-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status das Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={completionChartData} cx="50%" cy="50%" labelLine={false} label>
                    {completionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} tarefas`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {completionChartData.map((item) => (
                  <div key={item.name} className="text-center">
                    <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: item.fill }} />
                    <p className="text-sm text-slate-600">{item.name}: {item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Productivity by Team Member */}
          <Card>
            <CardHeader>
              <CardTitle>Produtividade da Equipe (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productivityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="productivity" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Team Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas por Colaborador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr className="text-left">
                    <th className="py-3 px-4 font-semibold text-slate-900">Colaborador</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Total</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Concluídas</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Em Andamento</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Pendentes</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Atrasadas</th>
                    <th className="py-3 px-4 font-semibold text-slate-900">Produtividade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assigneeMetrics.sort((a, b) => b.productivity - a.productivity).map((metric) => (
                    <tr key={metric.email} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-900 font-medium">{metric.email.split("@")[0]}</td>
                      <td className="py-3 px-4 text-slate-600">{metric.total}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-700 border-0">{metric.completed}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-blue-100 text-blue-700 border-0">{metric.inProgress}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-amber-100 text-amber-700 border-0">{metric.pending}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {metric.delayed > 0 ? (
                          <Badge className="bg-red-100 text-red-700 border-0">{metric.delayed}</Badge>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${metric.productivity}%` }}
                            />
                          </div>
                          <span className="font-semibold text-slate-900">{metric.productivity}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Delayed Tasks */}
        {delayedTasks.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Tarefas Atrasadas ({delayedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {delayedTasks.slice(0, 10).map((task) => (
                  <div key={task.id} className="flex items-start justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="text-sm text-slate-500">Responsável: {task.assigned_to || "Não atribuído"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-700">
                        Venceu em {format(parseISO(task.end_date), "dd MMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}