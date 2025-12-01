import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Flag, Clock, ChevronDown, ChevronRight, TrendingUp } from "lucide-react";

import TaskExecutionHistoryDialog from "./TaskExecutionHistoryDialog";

const priorityConfig = {
  low: { label: "Baixa", color: "bg-[#EAEAEA] text-[#456C8D] border-[#EAEAEA]" },
  medium: { label: "Média", color: "bg-[#6FA6FF]/10 text-[#6FA6FF] border-[#6FA6FF]/30" },
  high: { label: "Alta", color: "bg-red-100 text-red-600 border-red-200" }
};

const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default function TaskTemplateItem({ template, index, onEdit, onDelete }) {
  const [showHistory, setShowHistory] = useState(false);
  const priority = priorityConfig[template.priority];

  const { data: executionHistory } = useQuery({
    queryKey: ['task-execution-history', template.id],
    queryFn: () => base44.entities.TaskExecutionHistory.filter({ template_id: template.id }, '-completed_date'),
    initialData: [],
  });

  const averageTime = executionHistory.length > 0
    ? executionHistory.reduce((sum, h) => sum + h.time_spent, 0) / executionHistory.length
    : null;

  const executionCount = executionHistory.length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white border border-[#EAEAEA] rounded-xl p-3 hover:shadow-md transition-all"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-[#EAEAEA] text-[#456C8D] text-xs border-[#EAEAEA]">
                #{index + 1}
              </Badge>
              <h5 className="font-semibold text-[#131A20] text-sm">
                {template.title}
              </h5>
            </div>
            
            {template.description && (
              <p className="text-[#456C8D] text-xs mb-2 line-clamp-2">
                {template.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={`border ${priority.color} text-xs`}>
                <Flag className="w-3 h-3 mr-1" />
                {priority.label}
              </Badge>
              {template.estimated_days && (
                <Badge variant="outline" className="bg-[#EAEAEA] text-[#456C8D] border-[#EAEAEA] text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {template.estimated_days} {template.estimated_days === 1 ? 'dia' : 'dias'}
                </Badge>
              )}
              {executionCount > 0 && (
                <>
                  <Badge 
                    variant="outline" 
                    className="bg-[#6FA6FF]/10 text-[#6FA6FF] border-[#6FA6FF]/30 text-xs cursor-pointer hover:bg-[#6FA6FF]/20"
                    onClick={() => setShowHistory(true)}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {executionCount} {executionCount === 1 ? 'execução' : 'execuções'}
                  </Badge>
                  {averageTime && (
                    <Badge variant="outline" className="bg-[#EAEAEA] text-[#456C8D] border-[#EAEAEA] text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Média: {formatTime(averageTime)}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            {executionCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(true)}
                className="h-7 w-7 text-[#456C8D] hover:text-[#6FA6FF] hover:bg-[#6FA6FF]/10 rounded-lg"
              >
                <TrendingUp className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(template)}
              className="h-7 w-7 text-[#456C8D] hover:text-[#6FA6FF] hover:bg-[#6FA6FF]/10 rounded-lg"
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(template.id)}
              className="h-7 w-7 text-[#456C8D] hover:text-red-500 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </motion.div>

      <TaskExecutionHistoryDialog
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        template={template}
        executionHistory={executionHistory}
      />
    </>
  );
}