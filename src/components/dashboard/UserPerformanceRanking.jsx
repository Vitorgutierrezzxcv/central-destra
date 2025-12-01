import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target } from "lucide-react";
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
  }).filter(stat => stat.totalTasks > 0);

  const rankedUsers = [...userStats].sort((a, b) => b.completedTasks - a.completedTasks);
  const chartData = rankedUsers.slice(0, 7);
  const maxTasks = Math.max(...chartData.map(s => s.completedTasks), 10);

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
      <CardHeader className="border-b border-slate-100 p-3 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base md:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 flex-shrink-0" />
            <span className="truncate">Produtividade</span>
          </CardTitle>
          <Badge variant="outline" className="bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-200 text-xs flex-shrink-0">
            Top {rankedUsers.length}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-xs md:text-sm">
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg md:text-2xl text-slate-900">{rankedUsers.reduce((acc, u) => acc + u.completedTasks, 0)}</span>
            <span className="text-slate-600">Total</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-slate-300"></div>
            <span className="text-slate-600 text-xs">Pend.</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <span className="text-slate-600 text-xs">Concl.</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Modern Chart */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl md:rounded-2xl p-3 md:p-6 overflow-hidden">
          <div className="flex items-end justify-around gap-1 md:gap-2 h-32 md:h-48">
            {chartData.slice(0, 5).map((stat, index) => {
              const displayName = stat.user.display_name || stat.user.full_name?.split(' ')[0] || 'User';
              const heightPercentage = (stat.completedTasks / maxTasks) * 100;
              const isLeader = index === 0;
              
              return (
                <motion.div
                  key={stat.user.id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex flex-col items-center gap-1 md:gap-2 flex-1 min-w-0 max-w-[60px] md:max-w-[80px]"
                >
                  {/* Badge for leader */}
                  {isLeader && stat.completedTasks > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="relative mb-0.5 md:mb-1"
                    >
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-3 py-0.5 md:py-1 rounded-full shadow-lg whitespace-nowrap">
                        {stat.completionRate}%
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-2 border-r-2 border-t-2 md:border-l-4 md:border-r-4 md:border-t-4 border-transparent border-t-orange-500"></div>
                    </motion.div>
                  )}
                  
                  {/* Bar */}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.6, type: "spring" }}
                    className="w-full relative"
                    style={{ 
                      height: `${Math.max(heightPercentage, 10)}%`,
                      originY: 1
                    }}
                  >
                    <div
                      className={`w-full h-full rounded-t-lg md:rounded-t-xl shadow-lg transition-all hover:scale-105 ${
                        isLeader
                          ? 'bg-gradient-to-t from-orange-400 to-amber-300'
                          : index % 2 === 0
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-t from-slate-300 to-slate-200'
                      }`}
                    >
                      {stat.completedTasks > 0 && (
                        <div className="absolute inset-x-0 -top-4 md:-top-6 text-center">
                          <span className="text-[10px] md:text-xs font-bold text-slate-700">
                            {stat.completedTasks}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* User name */}
                  <div className="text-center w-full overflow-hidden">
                    <p className="text-[10px] md:text-xs font-medium text-slate-700 truncate">
                      {displayName.length > 6 ? displayName.substring(0, 5) + '.' : displayName}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Ranking List */}
        <div className="space-y-2 md:space-y-3">
          <h4 className="text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Target className="w-3 h-3 md:w-4 md:h-4" />
            Classificação
          </h4>
          {rankedUsers.slice(0, 5).map((stat, index) => {
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
                className="bg-gradient-to-r from-slate-50 to-white p-2 md:p-4 rounded-lg md:rounded-xl border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Rank Position */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    {index < 3 ? (
                      <Trophy className={`w-5 h-5 md:w-7 md:h-7 ${medalColors[index]}`} />
                    ) : (
                      <div className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-xs md:text-base font-bold text-slate-600">#{index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <Avatar className="w-8 h-8 md:w-12 md:h-12 border-2 border-white shadow-md flex-shrink-0">
                    {stat.user.profile_photo_url ? (
                      <AvatarImage src={stat.user.profile_photo_url} alt={displayName} />
                    ) : null}
                    <AvatarFallback 
                      className="text-white font-semibold text-xs md:text-base"
                      style={{ background: colors[index % colors.length] }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1 md:gap-2">
                      <h5 className="font-semibold text-slate-900 text-xs md:text-base truncate">
                        {displayName}
                      </h5>
                      {index === 0 && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] md:text-xs px-1 md:px-2 flex-shrink-0">
                          🏆
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm text-slate-600">
                      <span className="font-medium text-green-600">
                        {stat.completedTasks} feita{stat.completedTasks !== 1 ? 's' : ''}
                      </span>
                      <span className="text-slate-400 hidden sm:inline">•</span>
                      <span className="hidden sm:inline">
                        {stat.inProgressTasks} andamento
                      </span>
                    </div>
                  </div>

                  {/* Completion Rate */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {stat.completionRate}%
                    </div>
                    <div className="text-[10px] md:text-xs text-slate-500 hidden sm:block">conclusão</div>
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