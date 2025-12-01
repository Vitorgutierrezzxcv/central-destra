import React from "react";
import { Card } from "@/components/ui/card";
import { CheckSquare, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TaskDescriptionDisplay({ description }) {
  if (!description) return null;

  try {
    const parsed = JSON.parse(description);

    if (parsed.type === "checklist" && parsed.items?.length > 0) {
      const completed = parsed.items.filter((item) => item.completed).length;
      const total = parsed.items.length;
      const percentage = Math.round(completed / total * 100);

      return (
        <Card className="p-3 md:p-4 bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-sm text-slate-900">Checklist</span>
            </div>
            <Badge variant="outline" className="bg-white text-xs">
              {completed}/{total} concluído{completed !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          {percentage > 0 &&
          <div className="mb-3">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${percentage}%` }} />

              </div>
            </div>
          }

          <div className="space-y-2">
            {parsed.items.map((item, index) =>
            <div key={index} className="flex items-center gap-2 text-sm">
                <input
                type="checkbox"
                checked={item.completed}
                disabled
                className="w-4 h-4 rounded border-slate-300 text-purple-600" />

                <span className={item.completed ? 'line-through text-slate-500' : 'text-slate-700'}>
                  {item.text || `Item ${index + 1}`}
                </span>
              </div>
            )}
          </div>
        </Card>);

    } else if (parsed.type === "text" && parsed.content) {
      return (
        <div className="text-sm text-slate-600 whitespace-pre-wrap">
          {parsed.content}
        </div>);

    }
  } catch {
    // If not JSON, treat as plain text
    return (
      <div className="text-slate-50 text-sm whitespace-pre-wrap">
        {description}
      </div>);

  }

  return null;
}