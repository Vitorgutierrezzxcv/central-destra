import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Trash2, Play, Pause, Calendar, Repeat, Flag, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const recurrenceLabels = {
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal"
};

const priorityConfig = {
  low: { label: "Baixa", color: "bg-[#EAEAEA] text-[#456C8D]" },
  medium: { label: "Média", color: "bg-[#6FA6FF]/10 text-[#6FA6FF]" },
  high: { label: "Alta", color: "bg-red-100 text-red-600" }
};

const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function RecurringTaskCard({ task, projects, onEdit, onDelete, onToggleActive, onGenerateNow, isGenerating }) {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: userProfiles } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  const project = projects.find(p => p.id === task.project_id);
  const priority = priorityConfig[task.priority];

  // Find user
  const userProfile = userProfiles.find(p => p.user_email === task.assigned_to);
  const user = users.find(u => u.email === task.assigned_to);
  const displayName = userProfile?.display_name || userProfile?.full_name || user?.display_name || user?.full_name || task.assigned_to?.split('@')[0] || 'Sem responsável';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const formatRecurrence = () => {
    let text = recurrenceLabels[task.recurrence_type];
    if (task.recurrence_interval > 1) {
      text = `A cada ${task.recurrence_interval} ${task.recurrence_type === 'daily' ? 'dias' : task.recurrence_type === 'weekly' ? 'semanas' : 'meses'}`;
    }

    if (task.recurrence_type === 'weekly' && task.weekdays && task.weekdays.length > 0) {
      const days = task.weekdays.map(d => weekdayLabels[d]).join(', ');
      text += ` (${days})`;
    }

    if (task.recurrence_type === 'monthly' && task.day_of_month) {
      text += ` (dia ${task.day_of_month})`;
    }

    return text;
  };

  const formatTimeEstimate = (seconds) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#EAEAEA] ${task.active ? 'bg-white' : 'bg-[#EAEAEA]/30 opacity-75'}`}>
        <CardHeader className="bg-[#6FA6FF] text-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{task.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${task.active ? 'bg-[#131A20]' : 'bg-[#456C8D]'} text-white text-xs`}>
                  {task.active ? 'Ativa' : 'Pausada'}
                </Badge>
                <Badge className={`${priority.color} text-xs`}>
                  {priority.label}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleActive(task)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              {task.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {task.description && (
            <p className="text-sm text-[#456C8D] line-clamp-2">{task.description}</p>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#131A20]">
              <Repeat className="w-4 h-4 text-[#6FA6FF]" />
              <span className="font-medium">{formatRecurrence()}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#131A20]">
              <Avatar className="w-5 h-5">
                <AvatarFallback className="text-xs bg-[#6FA6FF] text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span>{displayName}</span>
            </div>

            {project && (
              <div className="flex items-center gap-2 text-sm text-[#131A20]">
                <Flag className="w-4 h-4 text-[#6FA6FF]" />
                <span>{project.name}</span>
              </div>
            )}

            {formatTimeEstimate(task.time_estimate) && (
              <div className="flex items-center gap-2 text-sm text-[#131A20]">
                <Clock className="w-4 h-4 text-[#6FA6FF]" />
                <span>{formatTimeEstimate(task.time_estimate)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-[#131A20]">
              <Calendar className="w-4 h-4 text-[#6FA6FF]" />
              <span>
                Início: {format(parseISO(task.start_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>

            {task.next_generation_date && (
              <div className="bg-[#6FA6FF]/10 border border-[#6FA6FF]/30 rounded-lg p-2">
                <p className="text-xs text-[#131A20] font-medium">
                  Próxima geração: {format(parseISO(task.next_generation_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}

            {task.end_date && (
              <div className="flex items-center gap-2 text-xs text-[#456C8D]">
                <Calendar className="w-3 h-3" />
                <span>Fim: {format(parseISO(task.end_date), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerateNow(task)}
              disabled={isGenerating || !task.active}
              className="flex-1 text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              Gerar Agora
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(task)}
              className="h-8 w-8"
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}