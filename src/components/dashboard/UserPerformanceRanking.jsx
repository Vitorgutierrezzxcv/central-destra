import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Target } from "lucide-react";

const avatarColors = ["#6FA6FF", "#456C8D", "#131A20", "#7C9CBF", "#A8C4E5"];

export default function UserPerformanceRanking() {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const userStats = users.map(user => {
    const userTasks = tasks.filter(t => t.assigned_to === user.email);
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = userTasks.filter(t => t.status === 'in_progress').length;
    const totalTasks = userTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { user, completedTasks, inProgressTasks, totalTasks, completionRate };
  }).filter(s => s.totalTasks > 0);

  const rankedUsers = [...userStats].sort((a, b) => b.completedTasks - a.completedTasks);

  if (rankedUsers.length === 0) return null;

  const maxTasks = Math.max(...rankedUsers.map(s => s.completedTasks), 1);

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-normal text-[#131A20]">Produtividade da Equipe</h2>
          <p className="text-xs text-[#456C8D] font-light mt-0.5">{rankedUsers.length} membros · {rankedUsers.reduce((acc, u) => acc + u.completedTasks, 0)} concluídas</p>
        </div>
        <div className="w-8 h-8 bg-[#EAEAEA] rounded-xl flex items-center justify-center">
          <Trophy className="w-4 h-4 text-[#131A20]" />
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-24 mb-5">
        {rankedUsers.slice(0, 6).map((stat, index) => {
          const displayName = stat.user.display_name || stat.user.full_name?.split(' ')[0] || 'User';
          const height = Math.max((stat.completedTasks / maxTasks) * 100, 6);
          const barColor = index === 0 ? '#131A20' : index === 1 ? '#456C8D' : '#EAEAEA';

          return (
            <div key={stat.user.id} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[9px] text-[#456C8D] font-light">{stat.completedTasks}</span>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{ height: `${height}%`, background: barColor, minHeight: 4 }}
              />
              <span className="text-[9px] text-[#456C8D] font-light truncate w-full text-center">
                {displayName.substring(0, 6)}
              </span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-1">
        {rankedUsers.slice(0, 5).map((stat, index) => {
          const displayName = stat.user.display_name || stat.user.full_name || "Usuário";
          const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

          return (
            <div
              key={stat.user.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F7F7] transition-colors"
            >
              <span className="text-[11px] font-light text-[#456C8D] w-4 text-center flex-shrink-0">
                {index + 1}
              </span>
              <Avatar className="w-7 h-7 flex-shrink-0">
                {stat.user.profile_photo_url && (
                  <AvatarImage src={stat.user.profile_photo_url} alt={displayName} />
                )}
                <AvatarFallback
                  className="text-white text-[10px] font-normal"
                  style={{ background: avatarColors[index % avatarColors.length] }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-normal text-[#131A20] truncate">{displayName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-light text-[#456C8D] tabular-nums">{stat.completedTasks} tasks</span>
                <span className="text-xs font-normal text-[#131A20] tabular-nums">{stat.completionRate}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}