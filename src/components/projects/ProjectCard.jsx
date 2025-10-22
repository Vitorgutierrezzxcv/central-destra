import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

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

export default function ProjectCard({ project, stats, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`${createPageUrl("ProjectDetail")}?id=${project.id}`}>
        <Card className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-all border-none rounded-2xl md:rounded-3xl bg-white/80 backdrop-blur-sm h-full">
          {/* Colored Header */}
          <div className={`h-24 md:h-28 bg-gradient-to-br ${colorClasses[project.color] || colorClasses.blue} p-4 md:p-5`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg md:text-xl mb-1 line-clamp-2">
                  {project.name}
                </h3>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {stats.total} tarefa{stats.total !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="p-4 md:p-5">
            {project.description && (
              <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px]">
                {project.description}
              </p>
            )}
            
            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Progresso</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{stats.percentage}%</span>
                  {stats.percentage === 100 && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
              <Progress value={stats.percentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{stats.completed} concluída{stats.completed !== 1 ? 's' : ''}</span>
                <span>{stats.total - stats.completed} pendente{(stats.total - stats.completed) !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {new Date(project.created_date).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'short' 
                })}
              </span>
              <div className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700">
                Ver detalhes
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}