import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, User, TrendingUp, Folder } from "lucide-react";

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

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function TaskExecutionHistoryDialog({ isOpen, onClose, template, executionHistory }) {
  const averageTime = executionHistory.length > 0
    ? executionHistory.reduce((sum, h) => sum + h.time_spent, 0) / executionHistory.length
    : 0;

  const minTime = executionHistory.length > 0
    ? Math.min(...executionHistory.map(h => h.time_spent))
    : 0;

  const maxTime = executionHistory.length > 0
    ? Math.max(...executionHistory.map(h => h.time_spent))
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Histórico de Execução
          </DialogTitle>
          <DialogDescription>
            {template.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-900">Total</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {executionHistory.length}
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {executionHistory.length === 1 ? 'execução' : 'execuções'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-900">Média</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatTime(averageTime)}
                </div>
                <p className="text-xs text-green-700 mt-1">tempo médio</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-900">Mínimo</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatTime(minTime)}
                </div>
                <p className="text-xs text-purple-700 mt-1">mais rápido</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-900">Máximo</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatTime(maxTime)}
                </div>
                <p className="text-xs text-orange-700 mt-1">mais lento</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Execuções */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Histórico Detalhado
            </h3>
            <div className="space-y-3">
              {executionHistory.length > 0 ? (
                executionHistory.map((history, index) => (
                  <Card key={history.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Folder className="w-4 h-4 text-indigo-600" />
                            <span className="font-semibold text-slate-900">
                              {history.project_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              #{executionHistory.length - index}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Tempo: <strong className="text-slate-900">{formatTime(history.time_spent)}</strong></span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Data: <strong className="text-slate-900">{formatDate(history.completed_date)}</strong></span>
                            </div>
                            
                            {history.completed_by && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <User className="w-3.5 h-3.5" />
                                <span className="truncate">
                                  <strong className="text-slate-900">{history.completed_by.split('@')[0]}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <Badge 
                            className={`
                              ${history.time_spent < averageTime 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : history.time_spent > averageTime
                                ? 'bg-orange-100 text-orange-700 border-orange-200'
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                              }
                            `}
                          >
                            {history.time_spent < averageTime 
                              ? '↓ Abaixo da média' 
                              : history.time_spent > averageTime
                              ? '↑ Acima da média'
                              : '= Na média'
                            }
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma execução registrada ainda</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}