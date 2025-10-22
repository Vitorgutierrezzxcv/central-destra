import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";

const colors = [
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
];

const medalColors = {
  0: "text-yellow-500",
  1: "text-slate-400",
  2: "text-orange-600"
};

export default function UserPerformanceRanking() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
    initialData: [],
  });

  // Calculate user performance
  const userStats = users.map(user => {
    const userTasks = tasks.filter(t => t.assigned_to === user.email);
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = userTasks.filter(t => t.status === 'in_progress').length;
    const totalTasks = userTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      user,
      completedTasks,
      inProgressTasks,
      totalTasks,
      completionRate
    };
  }).filter(stat => stat.totalTasks > 0); // Only show users with tasks

  // Sort by completed tasks
  const rankedUsers = [...userStats].sort((a, b) => b.completedTasks - a.completedTasks);

  // Prepare data for chart
  const chartData = rankedUsers.slice(0, 5).map(stat => ({
    name: stat.user.display_name || stat.user.full_name?.split(' ')[0] || 'Usuário',
    completedTasks: stat.completedTasks,
    inProgressTasks: stat.inProgressTasks
  }));

  if (rankedUsers.length === 0) {
    return (
      <Card className="shadow-xl border-none rounded-2xl md:rounded-3xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-100 p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ranking de Desempenho
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="text-center py-8 text-slate-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma tarefa atribuída ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-none rounded-2xl md:rounded-3xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ranking de Desempenho
          </CardTitle>
          <Badge variant="outline" className="bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-200">
            Top {rankedUsers.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-6">
        {/* Chart */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tarefas Concluídas
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="completedTasks" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Classificação
          </h4>
          {rankedUsers.map((stat, index) => {
            const displayName = stat.user.display_name || stat.user.full_name || "Usuário";
            const initials = displayName
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <motion.div
                key={stat.user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-slate-50 to-white p-3 md:p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Rank Position */}
                  <div className="flex flex-col items-center">
                    {index < 3 ? (
                      <Trophy className={`w-6 h-6 md:w-7 md:h-7 ${medalColors[index]}`} />
                    ) : (
                      <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-sm md:text-base font-bold text-slate-600">#{index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-white shadow-md">
                    {stat.user.profile_photo_url ? (
                      <AvatarImage src={stat.user.profile_photo_url} alt={displayName} />
                    ) : null}
                    <AvatarFallback 
                      className="text-white font-semibold text-sm md:text-base"
                      style={{ background: colors[index % colors.length] }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-slate-900 text-sm md:text-base truncate">
                        {displayName}
                      </h5>
                      {index === 0 && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2">
                          🏆 Líder
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                      <span className="font-medium text-green-600">
                        {stat.completedTasks} concluída{stat.completedTasks !== 1 ? 's' : ''}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>
                        {stat.inProgressTasks} em andamento
                      </span>
                    </div>
                  </div>

                  {/* Completion Rate */}
                  <div className="text-right">
                    <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {stat.completionRate}%
                    </div>
                    <div className="text-xs text-slate-500">conclusão</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}