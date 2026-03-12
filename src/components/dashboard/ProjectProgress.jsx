import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";
import { FolderKanban } from "lucide-react";

export default function ProjectProgress({ projects, tasks }) {
  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 4);

  const getProjectProgress = (projectId) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    const total = projectTasks.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  if (activeProjects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 bg-[#EAEAEA] rounded-xl mx-auto mb-3 flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-[#456C8D]" />
        </div>
        <p className="text-sm text-[#456C8D] font-light">Nenhum projeto ativo</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {activeProjects.map((project) => {
        const { completed, total, percentage } = getProjectProgress(project.id);
        return (
          <Link
            key={project.id}
            to={`${createPageUrl("ProjectDetail")}?id=${project.id}`}
            className="block group"
          >
            <div className="p-4 rounded-xl border border-[#EAEAEA] hover:border-[#EAEAEA] hover:bg-[#F7F7F7] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#131A20] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-normal">
                      {project.name[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-normal text-[#131A20] truncate">{project.name}</p>
                    <p className="text-xs text-[#456C8D] font-light">{completed} / {total} tarefas</p>
                  </div>
                </div>
                <span className="text-sm font-light text-[#131A20] flex-shrink-0 ml-2 tabular-nums">{percentage}%</span>
              </div>
              <div className="h-1 bg-[#EAEAEA] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6FA6FF] rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}