import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertCircle, XCircle, Upload, FileText, Key, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const statusConfig = {
  pending: { label: "Pendente", color: "bg-slate-500/20 text-slate-300 border-slate-500/30", icon: Clock },
  in_progress: { label: "Em andamento", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: Clock },
  completed: { label: "Concluído", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  blocked: { label: "Bloqueado", color: "bg-rose-500/20 text-rose-300 border-rose-500/30", icon: XCircle },
};

const typeIcons = {
  document: FileText,
  access: Key,
  information: Info,
  approval: CheckCircle2,
  other: Clock,
};

function OnboardingItemCard({ item, canUpdate, onMarkComplete }) {
  const cfg = statusConfig[item.status] || statusConfig.pending;
  const Icon = cfg.icon;
  const TypeIcon = typeIcons[item.item_type] || typeIcons.other;
  const isClientSide = item.responsible_side === "client";

  return (
    <div className={`bg-[#0D1221] border rounded-2xl p-5 transition-all
      ${item.status === "completed" ? "border-emerald-500/10 opacity-70" : isClientSide ? "border-amber-500/20 hover:border-amber-500/30" : "border-white/5 hover:border-white/10"}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
          ${item.status === "completed" ? "bg-emerald-500/10" : isClientSide ? "bg-amber-500/10" : "bg-white/5"}`}>
          {item.status === "completed" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <TypeIcon className={`w-5 h-5 ${isClientSide ? "text-amber-400" : "text-slate-400"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <h3 className={`text-sm font-semibold ${item.status === "completed" ? "text-slate-400 line-through" : "text-white"}`}>
              {item.title}
            </h3>
            <Badge className={`text-xs ${cfg.color}`}>
              <Icon className="w-3 h-3 mr-1" />
              {cfg.label}
            </Badge>
            {isClientSide && item.status !== "completed" && (
              <Badge className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">Sua responsabilidade</Badge>
            )}
          </div>
          {item.description && <p className="text-xs text-slate-400 mt-1">{item.description}</p>}
          {item.notes && (
            <div className="mt-2 bg-white/3 rounded-lg p-2">
              <p className="text-xs text-slate-400">{item.notes}</p>
            </div>
          )}
          {item.attachment_urls?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {item.attachment_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10">
                  <FileText className="w-3 h-3" />
                  Arquivo {i + 1}
                </a>
              ))}
            </div>
          )}
          {canUpdate && isClientSide && item.status !== "completed" && (
            <button
              onClick={() => onMarkComplete(item)}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Marcar como concluído
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientPortalOnboarding() {
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["client_projects", user?.company_id],
    queryFn: () => base44.entities.Project.filter({ company_id: user.company_id, client_portal_enabled: true }),
    enabled: !!user?.company_id
  });
  const activeProject = projects.find(p => p.status === "active") || projects[0];

  const { data: items = [] } = useQuery({
    queryKey: ["client_onboarding_items", activeProject?.id],
    queryFn: () => base44.entities.OnboardingItem.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id
  });

  const markCompleteMutation = useMutation({
    mutationFn: (item) => base44.entities.OnboardingItem.update(item.id, { status: "completed" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client_onboarding_items"] })
  });

  const isApprover = user?.role === "client_approver" || user?.role === "admin";

  const completed = items.filter(i => i.status === "completed").length;
  const total = items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const destraItems = items.filter(i => i.responsible_side === "destra");
  const clientItems = items.filter(i => i.responsible_side === "client");
  const clientPending = clientItems.filter(i => i.status !== "completed");

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Onboarding</h1>
          <p className="text-slate-400 text-sm mt-1">Checklist de início de projeto.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Progress */}
        <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Progresso do Onboarding</h2>
            <span className="text-xl font-bold text-blue-400">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/10" />
          <p className="text-xs text-slate-500 mt-2">{completed} de {total} itens concluídos</p>

          {clientPending.length > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300">{clientPending.length} item{clientPending.length > 1 ? "s" : ""} aguardando sua ação.</p>
            </div>
          )}
        </div>

        {/* Client items */}
        {clientItems.length > 0 && (
          <div>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Seus itens de responsabilidade
            </h2>
            <div className="space-y-3">
              {clientItems.map(item => (
                <OnboardingItemCard
                  key={item.id}
                  item={item}
                  canUpdate={isApprover}
                  onMarkComplete={markCompleteMutation.mutate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Destra items */}
        {destraItems.length > 0 && (
          <div>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Itens a cargo da Destra
            </h2>
            <div className="space-y-3">
              {destraItems.map(item => (
                <OnboardingItemCard
                  key={item.id}
                  item={item}
                  canUpdate={false}
                  onMarkComplete={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Checklist de onboarding não iniciado.</p>
          </div>
        )}
      </div>
    </div>
  );
}