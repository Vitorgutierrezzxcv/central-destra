import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FolderKanban, ListTodo, CheckCircle2, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.filter({ status: 'active' }),
    initialData: [],
  });

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date'),
    initialData: [],
  });

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  const recentProjects = projects.slice(0, 3);
  const upcomingTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Visão Geral
          </h1>
          <p className="text-slate-600">Acompanhe o progresso dos seus projetos e tarefas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90">Projetos Ativos</CardTitle>
                <FolderKanban className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingProjects ? (
                <Skeleton className="h-10 w-20 bg-white/20" />
              ) : (
                <div className="text-3xl font-bold">{activeProjects}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90">Tarefas Concluídas</CardTitle>
                <CheckCircle2 className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <Skeleton className="h-10 w-20 bg-white/20" />
              ) : (
                <div className="text-3xl font-bold">{completedTasks}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90">Em Andamento</CardTitle>
                <TrendingUp className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <Skeleton className="h-10 w-20 bg-white/20" />
              ) : (
                <div className="text-3xl font-bold">{inProgressTasks}</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium opacity-90">Tarefas Pendentes</CardTitle>
                <Clock className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <Skeleton className="h-10 w-20 bg-white/20" />
              ) : (
                <div className="text-3xl font-bold">{pendingTasks}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900">Projetos Recentes</CardTitle>
                <Link to={createPageUrl("Projects")}>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingProjects ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map(project => (
                    <Link 
                      key={project.id}
                      to={createPageUrl("Projects")}
                      className="block p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${project.color}-500`} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{project.name}</h3>
                          <p className="text-sm text-slate-600 line-clamp-1">{project.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum projeto ainda</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900">Próximas Tarefas</CardTitle>
                <Link to={createPageUrl("Tasks")}>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    Ver todas <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingTasks ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : upcomingTasks.length > 0 ? (
                <div className="space-y-2">
                  {upcomingTasks.map(task => (
                    <div 
                      key={task.id}
                      className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{task.title}</h3>
                          {task.scheduled_date && (
                            <p className="text-sm text-slate-500 mt-1">
                              {new Date(task.scheduled_date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <span className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : ''}
                        `}>
                          {task.status === 'pending' ? 'Pendente' : 'Em andamento'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma tarefa pendente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}