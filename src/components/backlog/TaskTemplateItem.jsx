import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Flag, Clock } from "lucide-react";

const priorityConfig = {
  low: { label: "Baixa", color: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: { label: "Média", color: "bg-blue-100 text-blue-700 border-blue-200" },
  high: { label: "Alta", color: "bg-red-100 text-red-700 border-red-200" }
};

export default function TaskTemplateItem({ template, index, onEdit, onDelete }) {
  const priority = priorityConfig[template.priority];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs">
              #{index + 1}
            </Badge>
            <h5 className="font-semibold text-slate-900 text-sm">
              {template.title}
            </h5>
          </div>
          
          {template.description && (
            <p className="text-slate-600 text-xs mb-2 line-clamp-2">
              {template.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`border ${priority.color} text-xs`}>
              <Flag className="w-3 h-3 mr-1" />
              {priority.label}
            </Badge>
            {template.estimated_days && (
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {template.estimated_days} {template.estimated_days === 1 ? 'dia' : 'dias'}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(template)}
            className="h-7 w-7 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(template.id)}
            className="h-7 w-7 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}