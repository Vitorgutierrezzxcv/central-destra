import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ChevronDown, ChevronRight, FileText } from "lucide-react";
import TaskDescriptionDisplay from "../tasks/TaskDescriptionDisplay";

export default function PlaybookCard({ playbook, index, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-slate-200 hover:shadow-lg transition-all">
        <CardHeader className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    <FileText className="w-3 h-3 mr-1" />
                    Playbook #{index + 1}
                  </Badge>
                </div>
                <h4 className="font-semibold text-slate-900">{playbook.title}</h4>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(playbook)}
                className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(playbook.id)}
                className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="p-4">
            <TaskDescriptionDisplay description={playbook.content} />
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}