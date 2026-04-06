import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare, Plus, Loader2, Ticket,
  CheckCircle2, Clock, AlertCircle, Circle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClientPortal } from "@/components/client-portal/useClientPortal";
import TicketChat from "@/components/client-portal/TicketChat";
import NewTicketForm from "@/components/client-portal/NewTicketForm";

const statusConfig = {
  open:           { label: "Aberto",          icon: Circle,        className: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress:    { label: "Em Andamento",    icon: Clock,         className: "bg-purple-100 text-purple-700 border-purple-200" },
  waiting_client: { label: "Aguardando você", icon: AlertCircle,   className: "bg-amber-100 text-amber-700 border-amber-200" },
  resolved:       { label: "Resolvido",       icon: CheckCircle2,  className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed:         { label: "Fechado",         icon: CheckCircle2,  className: "bg-slate-100 text-slate-600 border-slate-200" },
};

const categoryLabels = {
  bug:         "Problema",
  duvida:      "Dúvida",
  solicitacao: "Solicitação",
  entrega:     "Entrega",
  outro:       "Outro",
};

const priorityConfig = {
  low:    { label: "Baixa",   className: "bg-slate-100 text-slate-500" },
  medium: { label: "Média",   className: "bg-blue-100 text-blue-600" },
  high:   { label: "Alta",    className: "bg-orange-100 text-orange-600" },
  urgent: { label: "Urgente", className: "bg-rose-100 text-rose-600" },
};

export default function ClientPortalTickets() {
  const { userLoading, user, projects, companyId, contactId, canAccessProject } = useClientPortal();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [filter, setFilter] = useState("open");

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["client_tickets", activeProject?.id],
    queryFn: () => base44.entities.SupportTicket.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
  });

  const createMutation = useMutation({
    mutationFn: async (form) => {
      const ticket = await base44.entities.SupportTicket.create({
        ...form,
        project_id: activeProject.id,
        company_id: companyId || "",
        client_contact_id: contactId || "",
        opened_by_email: user.email,
        opened_by_name: user.full_name || user.name || user.email,
        status: "open",
      });
      // Notifica admins
      const admins = await base44.entities.User.list().catch(() => []);
      for (const admin of admins.filter(u => u.role === "admin")) {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `🎫 Novo chamado: ${form.title}`,
          body: `<p><strong>${user.full_name || user.email}</strong> abriu um novo chamado no projeto <strong>${activeProject.name}</strong>.</p>
            <p><strong>Categoria:</strong> ${categoryLabels[form.category]}</p>
            <p><strong>Prioridade:</strong> ${priorityConfig[form.priority]?.label}</p>
            <p><strong>Descrição:</strong> ${form.description || "-"}</p>
            <p>Acesse o painel para responder.</p>`
        }).catch(() => {});
      }
      return ticket;
    },
    onSuccess: (ticket) => {
      setShowNew(false);
      qc.invalidateQueries({ queryKey: ["client_tickets"] });
      setActiveTicket(ticket);
    }
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filteredTickets = tickets.filter(t => {
    if (filter === "open") return ["open", "in_progress", "waiting_client"].includes(t.status);
    if (filter === "resolved") return ["resolved", "closed"].includes(t.status);
    return true;
  });

  const openCount = tickets.filter(t => ["open", "in_progress", "waiting_client"].includes(t.status)).length;
  const waitingCount = tickets.filter(t => t.status === "waiting_client").length;

  // View: chat aberto
  if (activeTicket) {
    const refreshedTicket = tickets.find(t => t.id === activeTicket.id) || activeTicket;
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="mx-auto px-5 md:px-12 pt-24 md:pt-28 pb-6 w-full">
           <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-1">
             Chamados
           </p>
           <h1 className="text-[4.5rem] leading-[0.95] font-extralight text-slate-900 tracking-tight">Suporte</h1>
         </div>
        <div className="flex-1 w-full mx-auto px-5 md:px-12 py-4 flex flex-col">
           <div className="flex-1 border border-slate-100 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: 400 }}>
            <TicketChat
              ticket={refreshedTicket}
              user={user}
              onBack={() => setActiveTicket(null)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto px-5 md:px-12 pt-24 md:pt-28 pb-10">
         <div className="flex items-end justify-between gap-4 mb-4">
           <div>
             <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-1">
               Chamados
             </p>
             <h1 className="text-[4.5rem] leading-[0.95] font-extralight text-slate-900 tracking-tight">
               Suporte
             </h1>
           </div>
           {!showNew && (
             <Button onClick={() => setShowNew(true)} className="bg-primary hover:bg-primary/90 text-white gap-2 h-11">
               <Plus className="w-4 h-4" />
               Novo
             </Button>
           )}
         </div>
       </div>

       <div className="mx-auto px-5 md:px-12 space-y-4 pb-20 -mt-8 md:-mt-10">
        {!activeProject ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum projeto disponível.</p>
          </div>
        ) : (
          <>
            {showNew && (
              <NewTicketForm
                onSubmit={data => createMutation.mutate(data)}
                onCancel={() => setShowNew(false)}
                loading={createMutation.isPending}
              />
            )}

            {/* Stats */}
            {!showNew && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Abertos", value: openCount, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                  { label: "Aguard. Resposta", value: waitingCount, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                  { label: "Total", value: tickets.length, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
                ].map((s, i) => (
                  <div key={i} className={`border rounded-2xl p-4 ${s.bg}`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Filter tabs */}
            {!showNew && (
              <div className="flex gap-2">
                {[
                  { key: "open", label: "Em aberto" },
                  { key: "resolved", label: "Resolvidos" },
                  { key: "all", label: "Todos" },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filter === f.key
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Ticket list */}
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Nenhum chamado encontrado.</p>
                <p className="text-slate-400 text-sm mt-1">Clique em "Novo Chamado" para abrir um.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map(ticket => {
                  const st = statusConfig[ticket.status] || statusConfig.open;
                  const StIcon = st.icon;
                  const pr = priorityConfig[ticket.priority] || priorityConfig.medium;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setActiveTicket(ticket)}
                      className="w-full bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-2xl p-5 text-left transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${st.className}`}>
                          <StIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {ticket.title}
                            </p>
                            {ticket.status === "waiting_client" && (
                              <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 animate-pulse">
                                Resposta necessária
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[10px] ${st.className}`}>{st.label}</Badge>
                            <Badge className={`text-[10px] ${pr.className}`}>{pr.label}</Badge>
                            {ticket.category && (
                              <span className="text-[10px] text-slate-400">{categoryLabels[ticket.category]}</span>
                            )}
                            <span className="text-[10px] text-slate-400 ml-auto">
                              {format(new Date(ticket.created_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}