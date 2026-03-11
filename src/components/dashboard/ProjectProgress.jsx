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
    <div className="space-y-3">
      {activeProjects.map((project) => {
        const { completed, total, percentage } = getProjectProgress(project.id);
        return (
          <Link
            key={project.id}
            to={`${createPageUrl("ProjectDetail")}?id=${project.id}`}
            className="block group"
          >
            <div className="p-3 rounded-lg border border-[#EAEAEA] hover:border-[#6FA6FF]/30 hover:bg-[#F8F9FB] transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#131A20] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">
                      {project.name[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-normal text-[#131A20] truncate">{project.name}</p>
                    <p className="text-xs text-[#456C8D] font-light">{completed}/{total} tarefas</p>
                  </div>
                </div>
                <span className="text-xs font-normal text-[#456C8D] flex-shrink-0 ml-2">{percentage}%</span>
              </div>
              <Progress
                value={percentage}
                className="h-1 bg-[#EAEAEA]"
                style={{ '--tw-progress-bar': '#6FA6FF' }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}