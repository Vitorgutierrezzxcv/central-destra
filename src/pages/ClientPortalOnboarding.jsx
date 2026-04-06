import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, ChevronRight,
  Loader2, Upload, Paperclip, X, FileText, ExternalLink, Bell
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const responsibleLabels = {
  client: "Você",
  destra: "Equipe Destra",
  both: "Ambos"
};

const statusConfig = {
  pending:     { icon: Circle,       color: "text-slate-400",  label: "Pendente" },
  in_progress: { icon: Clock,        color: "text-blue-500",   label: "Em Andamento" },
  completed:   { icon: CheckCircle2, color: "text-emerald-500",label: "Concluído" },
  blocked:     { icon: AlertCircle,  color: "text-rose-500",   label: "Bloqueado" },
};

const itemTypeLabels = {
  document:    "Documento",
  access:      "Acesso",
  information: "Informação",
  approval:    "Aprovação",
  other:       "Outro",
};

export default function ClientPortalOnboarding() {
  const { userLoading, projects, canAccessProject, user, company } = useClientPortal();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState({});
  const [uploading, setUploading] = useState({});
  const [notifying, setNotifying] = useState({});
  const fileInputRefs = useRef({});

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["client_onboarding_items", activeProject?.id],
    queryFn: () => base44.entities.OnboardingItem.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => (a.order || 0) - (b.order || 0))
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OnboardingItem.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client_onboarding_items"] })
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const clientItems = items.filter(i => i.responsible_side === "client" || i.responsible_side === "both");
  const destraItems = items.filter(i => i.responsible_side === "destra");
  const completedAll = items.filter(i => i.status === "completed").length;
  const progress = items.length > 0 ? Math.round((completedAll / items.length) * 100) : 0;

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const handleFileUpload = async (item, files) => {
    if (!files || files.length === 0) return;
    setUploading(u => ({ ...u, [item.id]: true }));

    const newUrls = [...(item.attachment_urls || [])];
    const newNames = [...(item.attachment_names || [])];

    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUrls.push(file_url);
      newNames.push(file.name);
    }

    // Se há attachment_required e agora temos arquivos, muda status para in_progress
    const newStatus = item.status === "pending" && newUrls.length > 0 ? "in_progress" : item.status;

    await updateMutation.mutateAsync({
      id: item.id,
      data: {
        attachment_urls: newUrls,
        attachment_names: newNames,
        status: newStatus,
      }
    });

    setUploading(u => ({ ...u, [item.id]: false }));
  };

  const removeFile = async (item, index) => {
    const newUrls = [...(item.attachment_urls || [])];
    const newNames = [...(item.attachment_names || [])];
    newUrls.splice(index, 1);
    newNames.splice(index, 1);
    await updateMutation.mutateAsync({ id: item.id, data: { attachment_urls: newUrls, attachment_names: newNames } });
  };

  const markComplete = async (item) => {
    // Valida se attachment_required e não tem arquivo
    if (item.attachment_required && (!item.attachment_urls || item.attachment_urls.length === 0)) {
      alert("Este item requer o envio de um arquivo antes de ser concluído.");
      return;
    }
    await updateMutation.mutateAsync({
      id: item.id,
      data: { status: "completed", completed_at: new Date().toISOString() }
    });
    // Notifica admin automaticamente
    notifyAdmin(item, "completed");
  };

  const notifyAdmin = async (item, action) => {
    setNotifying(n => ({ ...n, [item.id]: true }));
    const clientName = user?.full_name || user?.name || user?.email || "Cliente";
    const projectName = activeProject?.name || "projeto";
    const companyName = company?.name || "";

    let subject, body;
    if (action === "completed") {
      subject = `✅ Item de onboarding concluído — ${projectName}`;
      body = `<p><strong>${clientName}</strong>${companyName ? ` (${companyName})` : ""} marcou o item de onboarding <strong>"${item.title}"</strong> como concluído no projeto <strong>${projectName}</strong>.</p>
        ${item.attachment_urls?.length ? `<p>Arquivos enviados: ${item.attachment_names?.join(", ") || item.attachment_urls.length + " arquivo(s)"}</p>` : ""}
        <p>Acesse o painel administrativo para revisar.</p>`;
    } else {
      subject = `📎 Arquivo enviado no onboarding — ${projectName}`;
      body = `<p><strong>${clientName}</strong>${companyName ? ` (${companyName})` : ""} enviou um arquivo para o item <strong>"${item.title}"</strong> no projeto <strong>${projectName}</strong>.</p>
        <p>Arquivos: ${item.attachment_names?.join(", ") || "1 arquivo"}</p>
        <p>Acesse o painel administrativo para revisar.</p>`;
    }

    // Busca admins para notificar
    const admins = await base44.entities.User.list().catch(() => []);
    const adminEmails = admins.filter(u => u.role === "admin").map(u => u.email);

    for (const email of adminEmails) {
      await base44.integrations.Core.SendEmail({ to: email, subject, body }).catch(() => {});
    }

    setNotifying(n => ({ ...n, [item.id]: false }));
  };

  const ItemCard = ({ item }) => {
    const cfg = statusConfig[item.status] || statusConfig.pending;
    const Icon = cfg.icon;
    const isClientSide = item.responsible_side === "client" || item.responsible_side === "both";
    const canInteract = isClientSide && item.status !== "completed";
    const isOpen = expanded[item.id];
    const isUploading = uploading[item.id];
    const isNotifying = notifying[item.id];
    const hasFiles = item.attachment_urls?.length > 0;

    return (
      <div className={`bg-white border rounded-2xl transition-all ${
        item.status === "completed" ? "border-emerald-100" :
        item.status === "in_progress" ? "border-blue-100" :
        item.attachment_required ? "border-amber-100" : "border-slate-100"
      }`}>
        {/* Header */}
        <div
          className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 rounded-2xl transition-colors"
          onClick={() => toggleExpand(item.id)}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
            item.status === "completed" ? "bg-emerald-50 border-emerald-200" :
            item.status === "in_progress" ? "bg-blue-50 border-blue-200" :
            "bg-slate-50 border-slate-200"
          }`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className={`text-sm font-semibold ${item.status === "completed" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                {item.title}
              </p>
              {item.item_type && item.item_type !== "other" && (
                <Badge className="text-xs bg-slate-100 text-slate-600 border-slate-200">
                  {itemTypeLabels[item.item_type]}
                </Badge>
              )}
              {item.attachment_required && item.status !== "completed" && (
                <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                  <Paperclip className="w-2.5 h-2.5 mr-1" />Arquivo obrigatório
                </Badge>
              )}
              {hasFiles && item.status !== "completed" && (
                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                  <Paperclip className="w-2.5 h-2.5 mr-1" />{item.attachment_urls.length} arquivo(s)
                </Badge>
              )}
            </div>
            {item.due_date && (
              <p className="text-xs text-slate-400">
                Prazo: {format(new Date(item.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`text-xs hidden sm:inline-flex ${
              item.status === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
              item.status === "in_progress" ? "bg-blue-100 text-blue-700 border-blue-200" :
              "bg-slate-100 text-slate-600 border-slate-200"
            }`}>
              {cfg.label}
            </Badge>
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {/* Expanded Content */}
        {isOpen && (
          <div className="px-5 pb-5 pt-0 border-t border-slate-100 space-y-4">
            {item.description && (
              <p className="text-sm text-slate-500 mt-4">{item.description}</p>
            )}
            {item.notes && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Observações da Destra</p>
                <p className="text-sm text-slate-700">{item.notes}</p>
              </div>
            )}

            {/* Arquivos existentes */}
            {hasFiles && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Arquivos enviados</p>
                {item.attachment_urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <a href={url} target="_blank" rel="noreferrer"
                      className="flex-1 text-sm text-blue-600 hover:underline truncate flex items-center gap-1">
                      {item.attachment_names?.[i] || `Arquivo ${i + 1}`}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    {canInteract && (
                      <button onClick={() => removeFile(item, i)}
                        className="p-1 rounded-lg hover:bg-rose-50 hover:text-rose-500 text-slate-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Area */}
            {canInteract && (
              <div>
                <input
                  type="file"
                  multiple
                  ref={el => fileInputRefs.current[item.id] = el}
                  onChange={e => handleFileUpload(item, e.target.files)}
                  className="hidden"
                  accept="*/*"
                />
                <button
                  onClick={() => fileInputRefs.current[item.id]?.click()}
                  disabled={isUploading}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl p-5 flex flex-col items-center gap-2 transition-all group disabled:opacity-60"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  )}
                  <p className="text-sm text-slate-500 group-hover:text-blue-600 transition-colors font-medium">
                    {isUploading ? "Enviando..." : "Clique para carregar arquivo"}
                  </p>
                  <p className="text-xs text-slate-400">Qualquer formato aceito</p>
                </button>
              </div>
            )}

            {/* Ações */}
            {item.status === "completed" && item.completed_at && (
              <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluído em {format(new Date(item.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}

            {canInteract && (
              <div className="flex items-center gap-3 pt-1">
                <Button
                  size="sm"
                  onClick={() => markComplete(item)}
                  disabled={updateMutation.isPending || isUploading || isNotifying}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {(updateMutation.isPending || isNotifying) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Marcar como Concluído
                </Button>

                {hasFiles && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => notifyAdmin(item, "upload")}
                    disabled={isNotifying}
                    className="gap-2 text-slate-600 border-slate-200"
                  >
                    {isNotifying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Bell className="w-3.5 h-3.5" />
                    )}
                    Notificar Destra
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-7 md:px-10">
        <div className="max-w-3xl mx-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase font-medium mb-2">
              {activeProject?.name || "Portal"}
            </p>
            <h1 className="text-2xl font-extralight text-slate-900 tracking-tight">Onboarding</h1>
            <p className="text-sm text-slate-400 font-light mt-1.5">Itens necessários para iniciar seu projeto.</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extralight text-slate-900">{progress}</span>
            <span className="text-sm text-slate-400 font-light">%</span>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{completedAll}/{items.length} itens</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 md:px-10 py-7 space-y-7">
        {!activeProject ? (
          <div className="flex flex-col items-center py-20">
            <CheckCircle2 className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 font-light">Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1">
              <div className="h-1 rounded-full bg-slate-900 transition-all duration-700"
                style={{ width: `${progress}%` }} />
            </div>

            {progress === 100 && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-emerald-700 font-light">Parabéns! Onboarding completo. Seu projeto está pronto para começar.</p>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
              </div>
            )}

            {/* Client Items */}
            {clientItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <p className="text-[10px] text-slate-400 tracking-widest uppercase font-medium">
                    Sua responsabilidade
                  </p>
                  <span className="text-[10px] text-slate-400 font-light">({clientItems.length})</span>
                </div>
                <div className="space-y-2">
                  {clientItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {/* Destra Items */}
            {destraItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <p className="text-[10px] text-slate-400 tracking-widest uppercase font-medium">
                    Equipe Destra
                  </p>
                  <span className="text-[10px] text-slate-400 font-light">({destraItems.length})</span>
                </div>
                <div className="space-y-2">
                  {destraItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {items.length === 0 && !isLoading && (
              <div className="flex flex-col items-center py-20">
                <CheckCircle2 className="w-10 h-10 text-slate-200 mb-4" />
                <p className="text-slate-400 font-light">Nenhum item de onboarding definido ainda.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}