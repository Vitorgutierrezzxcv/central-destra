import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, SendHorizontal } from "lucide-react";

export default function TaskApprovalFlow({ task, project, currentUser }) {
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    initialData: [],
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Determinar se o usuário atual é o gestor do projeto
  const isProjectManager = () => {
    if (!currentUser || !project) return false;
    return project.project_owner_internal === currentUser.email;
  };

  // Se a tarefa não requer aprovação, não renderizar nada
  if (!task.approval_required) {
    return null;
  }

  // Status de aprovação (usando o campo 'approval_status' se existir, ou inferir do status)
  const approvalStatus = task.approval_status || 'pending';

  const handleRequestApproval = async () => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { 
        approval_status: 'requested',
        approval_requested_at: new Date().toISOString()
      }
    });
  };

  const handleApprove = async () => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { 
        approval_status: 'approved',
        approval_approved_at: new Date().toISOString(),
        approval_approved_by: currentUser.email
      }
    });
  };

  const handleReject = async () => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { 
        approval_status: 'rejected',
        approval_rejected_at: new Date().toISOString(),
        approval_rejected_by: currentUser.email
      }
    });
  };

  const isProjectManager_ = isProjectManager();

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="text-sm font-medium text-blue-900">Fluxo de Aprovação</span>
        </div>
        {approvalStatus === 'approved' && (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        )}
        {approvalStatus === 'rejected' && (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        )}
        {approvalStatus === 'requested' && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            Aguardando Análise
          </Badge>
        )}
      </div>

      {/* Botões visíveis apenas para o gestor do projeto */}
      {isProjectManager_ && (
        <div className="flex gap-2 flex-wrap">
          {approvalStatus === 'pending' && (
            <Button
              size="sm"
              onClick={handleRequestApproval}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
              disabled={updateTaskMutation.isPending}
            >
              <SendHorizontal className="w-3 h-3 mr-1" />
              Solicitar Aprovação
            </Button>
          )}

          {approvalStatus === 'requested' && (
            <>
              <Button
                size="sm"
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                disabled={updateTaskMutation.isPending}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Aprovar
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                disabled={updateTaskMutation.isPending}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Rejeitar
              </Button>
            </>
          )}
        </div>
      )}

      {/* Informação para não-gestores */}
      {!isProjectManager_ && approvalStatus === 'requested' && (
        <p className="text-xs text-blue-800">
          Esta tarefa está aguardando aprovação do gestor do projeto.
        </p>
      )}
    </div>
  );
}