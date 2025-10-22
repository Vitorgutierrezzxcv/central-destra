
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FolderKanban } from "lucide-react";

const colorClasses = {
  blue: "from-blue-400 to-blue-500",
  purple: "from-purple-400 to-purple-500",
  green: "from-green-400 to-green-500",
  orange: "from-orange-400 to-orange-500",
  pink: "from-pink-400 to-pink-500",
  red: "from-red-400 to-red-500",
  indigo: "from-indigo-400 to-indigo-500",
  teal: "from-teal-400 to-teal-500",
};

export default function ProjectProgress({ projects, tasks }) {
  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 3);

  const getProjectProgress = (projectId) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    const total = projectTasks.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  if (activeProjects.length === 0) {
    return (
      <div className="text-center py-6 md:py-8">
        <FolderKanban className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-3" />
        <p className="text-sm md:text-base text-slate-600">Nenhum projeto ativo</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {activeProjects.map((project) => {
        const { completed, total, percentage } = getProjectProgress(project.id);
        
        return (
          <Link
            key={project.id}
            to={`${createPageUrl("ProjectDetail")}?id=${project.id}`}
            className="block"
          >
            <div className="bg-gradient-to-r from-slate-50 to-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br ${colorClasses[project.color] || colorClasses.blue} flex items-center justify-center shadow-md`}>
                  <span className="text-white font-bold text-base md:text-lg">
                    {project.name[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm md:text-base text-slate-900 truncate">{project.name}</h4>
                  <p className="text-xs text-slate-500">{completed}/{total} tarefas</p>
                </div>
                <Badge className="bg-slate-100 text-slate-700 rounded-full text-xs md:text-sm px-2 md:px-3">
                  {percentage}%
                </Badge>
              </div>
              <Progress value={percentage} className="h-1.5 md:h-2" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
