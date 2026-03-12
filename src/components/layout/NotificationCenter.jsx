import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, CheckCircle2, AlertCircle, FileText, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function NotificationCenter() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.email],
    queryFn: () => {
      if (!currentUser?.email) return [];
      return base44.entities.Notification.filter(
        { user_email: currentUser.email },
        '-created_date',
        50
      );
    },
    enabled: !!currentUser?.email,
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <FileText className="w-4 h-4" />;
      case 'task_approval_requested':
      case 'task_approval_approved':
      case 'task_approval_rejected':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'project_updated':
        return <FolderKanban className="w-4 h-4" />;
      case 'deadline_approaching':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'task_assigned':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'task_approval_requested':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'task_approval_approved':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'task_approval_rejected':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'project_updated':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      case 'deadline_approaching':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      task_assigned: 'Tarefa Atribuída',
      task_approval_requested: 'Aprovação Solicitada',
      task_approval_approved: 'Aprovação Concedida',
      task_approval_rejected: 'Aprovação Rejeitada',
      project_updated: 'Projeto Atualizado',
      deadline_approaching: 'Prazo Próximo',
    };
    return labels[type] || 'Notificação';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b border-slate-200 p-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Notificações</h2>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs text-blue-600 hover:text-blue-700"
              disabled={markAllAsReadMutation.isPending}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} transition-all ${
                    !notification.is_read ? 'ring-1 ring-blue-400' : 'opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm">
                          {getTypeLabel(notification.type)}
                        </p>
                        <button
                          onClick={() => deleteNotificationMutation.mutate(notification.id)}
                          className="flex-shrink-0 hover:opacity-70 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 mb-1">{notification.message}</p>
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className="text-xs h-6"
                          disabled={markAsReadMutation.isPending}
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}