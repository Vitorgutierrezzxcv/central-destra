import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ListTodo, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

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

export default function ExecutionStats({ templates, executionHistory }) {
  const totalExecutions = executionHistory.length;
  const averageTime = totalExecutions > 0
    ? executionHistory.reduce((sum, h) => sum + h.time_spent, 0) / totalExecutions
    : 0;

  const uniqueProjects = new Set(executionHistory.map(h => h.project_id)).size;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
      <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-none shadow-lg hover:shadow-xl transition-all rounded-2xl md:rounded-3xl">
        <CardContent className="p-3 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
            <div className="bg-white/80 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-md mb-2 md:mb-0 w-fit">
              <ListTodo className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div className="md:text-right">
              <div className="text-2xl md:text-4xl font-bold text-blue-600">
                {templates.length}
              </div>
            </div>
          </div>
          <p className="text-slate-700 font-medium text-xs md:text-sm">Templates</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-100 to-green-200 border-none shadow-lg hover:shadow-xl transition-all rounded-2xl md:rounded-3xl">
        <CardContent className="p-3 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
            <div className="bg-white/80 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-md mb-2 md:mb-0 w-fit">
              <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
            </div>
            <div className="md:text-right">
              <div className="text-2xl md:text-4xl font-bold text-green-600">
                {totalExecutions}
              </div>
            </div>
          </div>
          <p className="text-slate-700 font-medium text-xs md:text-sm">Execuções</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-none shadow-lg hover:shadow-xl transition-all rounded-2xl md:rounded-3xl">
        <CardContent className="p-3 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
            <div className="bg-white/80 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-md mb-2 md:mb-0 w-fit">
              <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
            </div>
            <div className="md:text-right">
              <div className="text-2xl md:text-4xl font-bold text-purple-600">
                {uniqueProjects}
              </div>
            </div>
          </div>
          <p className="text-slate-700 font-medium text-xs md:text-sm">Projetos</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-100 to-amber-200 border-none shadow-lg hover:shadow-xl transition-all rounded-2xl md:rounded-3xl">
        <CardContent className="p-3 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-4">
            <div className="bg-white/80 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-md mb-2 md:mb-0 w-fit">
              <Clock className="w-4 h-4 md:w-6 md:h-6 text-amber-600" />
            </div>
            <div className="md:text-right">
              <div className="text-2xl md:text-4xl font-bold text-amber-600">
                {formatTime(averageTime)}
              </div>
            </div>
          </div>
          <p className="text-slate-700 font-medium text-xs md:text-sm">Tempo Médio</p>
        </CardContent>
      </Card>
    </div>
  );
}