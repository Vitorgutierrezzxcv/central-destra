import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FolderOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const colorClasses = {
  blue: "from-blue-400 to-blue-600",
  purple: "from-purple-400 to-purple-600",
  green: "from-green-400 to-green-600",
  orange: "from-orange-400 to-orange-600",
  pink: "from-pink-400 to-pink-600",
  red: "from-red-400 to-red-600",
  indigo: "from-indigo-400 to-indigo-600",
  teal: "from-teal-400 to-teal-600",
};

export default function ProjectCard({ project, stats, onEdit, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-none">
        <div className={`h-2 bg-gradient-to-r ${colorClasses[project.color] || colorClasses.blue}`} />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[project.color] || colorClasses.blue} flex items-center justify-center shadow-md`}>
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1">
                {project.name}
              </CardTitle>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                onClick={() => onEdit(project)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px]">
            {project.description || "Sem descrição"}
          </p>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600">Progresso</span>
                <span className="font-semibold text-slate-900">
                  {stats.completed} / {stats.total} tarefas
                </span>
              </div>
              <Progress value={stats.percentage} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Criado em {new Date(project.created_date).toLocaleDateString('pt-BR')}
              </span>
              <span className={`text-sm font-semibold ${
                stats.percentage === 100 ? 'text-green-600' :
                stats.percentage > 50 ? 'text-blue-600' :
                'text-orange-600'
              }`}>
                {stats.percentage}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}