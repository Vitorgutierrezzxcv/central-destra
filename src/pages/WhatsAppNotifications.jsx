import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ALERT_LABELS = {
  task_due_2days:        { label: "Tarefa: 2 dias antes",  color: "bg-amber-100 text-amber-700 border-amber-200",  icon: "⚠️" },
  task_due_1day:         { label: "Tarefa: 1 dia antes",   color: "bg-orange-100 text-orange-700 border-orange-200", icon: "⚠️" },
  task_due_today:        { label: "Tarefa: vence hoje",    color: "bg-rose-100 text-rose-700 border-rose-200",      icon: "⏰" },
  task_overdue:          { label: "Tarefa: atrasada",      color: "bg-red-100 text-red-700 border-red-200",         icon: "🚨" },
  project_due_1day:      { label: "Projeto: 1 dia antes",  color: "bg-blue-100 text-blue-700 border-blue-200",      icon: "📌" },
  project_due_today:     { label: "Projeto: vence hoje",   color: "bg-purple-100 text-purple-700 border-purple-200",icon: "🗓️" },
  project_overdue:       { label: "Projeto: atrasado",     color: "bg-red-100 text-red-700 border-red-200",         icon: "🚨" },
};

const STATUS_CONFIG = {
  sent:    { label: "Enviado",  icon: CheckCircle2, color: "text-emerald-500" },
  failed:  { label: "Falhou",   icon: XCircle,      color: "text-rose-500" },
  skipped: { label: "Ignorado", icon: Clock,        color: "text-slate-400" },
};

const CONFIG_FIELDS = [
  { key: "internal_task_due_2days",   label: "Avisar responsável 2 dias antes da tarefa",   group: "Usuários Internos" },
  { key: "internal_task_due_1day",    label: "Avisar responsável 1 dia antes da tarefa",    group: "Usuários Internos" },
  { key: "internal_task_due_today",   label: "Avisar responsável no dia do prazo da tarefa", group: "Usuários Internos" },
  { key: "internal_task_overdue",     label: "Avisar responsável quando tarefa estiver atrasada", group: "Usuários Internos" },
  { key: "client_project_due_1day",   label: "Avisar cliente 1 dia antes do prazo do projeto", group: "Clientes" },
  { key: "client_project_due_today",  label: "Avisar cliente no dia do prazo do projeto",    group: "Clientes" },
  { key: "client_project_overdue",    label: "Avisar cliente quando projeto estiver atrasado", group: "Clientes" },
];

export default function WhatsAppNotifications() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("config");
  const [runningMonitor, setRunningMonitor] = useState(false);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["wa_config"],
    queryFn: async () => {
      const list = await base44.entities.WhatsAppNotificationConfig.filter({ config_key: "global" });
      return list[0] || null;
    },
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["wa_logs"],
    queryFn: () => base44.entities.WhatsAppNotificationLog.list("-sent_at", 100),
    enabled: activeTab === "logs",
  });

  const updateConfig = useMutation({
    mutationFn: async ({ key, value }) => {
      if (config?.id) {
        return base44.entities.WhatsAppNotificationConfig.update(config.id, { [key]: value });
      } else {
        return base44.entities.WhatsAppNotificationConfig.create({ config_key: "global", [key]: value });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wa_config"] }),
  });

  const runMonitor = async () => {
    setRunningMonitor(true);
    try {
      await base44.functions.invoke("whatsAppNotificationMonitor", {});
      qc.invalidateQueries({ queryKey: ["wa_logs"] });
    } catch (e) {
      console.error(e);
    }
    setRunningMonitor(false);
  };

  const groups = [...new Set(CONFIG_FIELDS.map(f => f.group))];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Notificações WhatsApp</h1>
              <p className="text-xs text-slate-400">Alertas automáticos de prazo para equipe e clientes</p>
            </div>
          </div>
          <button
            onClick={runMonitor}
            disabled={runningMonitor}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {runningMonitor
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
            {runningMonitor ? "Executando..." : "Rodar Agora"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl mb-6 w-fit">
          {[{ key: "config", label: "Configurações" }, { key: "logs", label: "Histórico de Envios" }].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Config Tab */}
        {activeTab === "config" && (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {configLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-slate-300 animate-spin" /></div>
            ) : groups.map(group => (
              <div key={group} className="p-5">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-4">{group}</p>
                <div className="space-y-4">
                  {CONFIG_FIELDS.filter(f => f.group === group).map(field => (
                    <div key={field.key} className="flex items-center justify-between gap-4">
                      <p className="text-sm text-slate-700">{field.label}</p>
                      <Switch
                        checked={config?.[field.key] ?? true}
                        onCheckedChange={v => updateConfig.mutate({ key: field.key, value: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{logs.length} registros recentes</p>
              <button onClick={() => qc.invalidateQueries({ queryKey: ["wa_logs"] })} className="p-2 hover:bg-white rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {logsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-slate-300 animate-spin" /></div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
                <MessageSquare className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm">Nenhuma notificação enviada ainda</p>
              </div>
            ) : (
              logs.map(log => {
                const alertInfo   = ALERT_LABELS[log.alert_type]   || { label: log.alert_type, color: "bg-slate-100 text-slate-600 border-slate-200", icon: "📬" };
                const statusInfo  = STATUS_CONFIG[log.status]       || STATUS_CONFIG.sent;
                const StatusIcon  = statusInfo.icon;

                return (
                  <div key={log.id} className="bg-white border border-slate-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${alertInfo.color}`}>
                            {alertInfo.icon} {alertInfo.label}
                          </span>
                          <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                          <span className={`text-[10px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 truncate">{log.entity_name}</p>
                        {log.project_name && log.entity_type === "task" && (
                          <p className="text-xs text-slate-400">📁 {log.project_name}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5">
                          {log.recipient_type === "client" ? "👤 Cliente" : "👩‍💼 Interno"} · {log.recipient_name || log.recipient_email} · {log.recipient_phone}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {log.error_message}
                          </p>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-300 flex-shrink-0 whitespace-nowrap">
                        {log.sent_at ? format(new Date(log.sent_at), "dd/MM HH:mm", { locale: ptBR }) : "—"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Info box */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-xs text-green-700 font-medium mb-1">⚙️ Automação Diária</p>
          <p className="text-xs text-green-600">
            O monitor roda automaticamente todos os dias às 08:00. Você também pode executar manualmente pelo botão "Rodar Agora".
            Telefones são lidos do perfil do usuário e do contato principal da empresa cliente.
          </p>
        </div>
      </div>
    </div>
  );
}