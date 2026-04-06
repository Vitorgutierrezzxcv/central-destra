import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, CheckCircle2, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClientPortal } from "@/components/client-portal/useClientPortal";

const criteria = [
  { key: "communication_score", label: "Comunicação", desc: "Clareza e qualidade da comunicação da equipe" },
  { key: "timeline_score", label: "Prazos", desc: "Cumprimento das datas acordadas" },
  { key: "quality_score", label: "Qualidade", desc: "Qualidade das entregas realizadas" },
  { key: "result_score", label: "Resultados", desc: "Alinhamento com seus objetivos" },
];

function StarRating({ value, onChange, size = "md" }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "lg" ? "w-7 h-7" : "w-5 h-5";
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange && onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`${sz} transition-colors ${(hovered || value) >= n ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ClientPortalSatisfaction() {
  const { userLoading, company, companyId, contactId, projects, canAccessProject } = useClientPortal();
  const [form, setForm] = useState({ overall_score: 0, communication_score: 0, timeline_score: 0, quality_score: 0, result_score: 0, comment: "" });
  const [submitted, setSubmitted] = useState(false);
  const qc = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const selectedProjectId = urlParams.get("project_id");
  const activeProject = projects.find(p =>
    selectedProjectId ? p.id === selectedProjectId && canAccessProject(p.id) : p.status === "active"
  ) || projects[0];

  const { data: surveys = [] } = useQuery({
    queryKey: ["client_surveys", activeProject?.id],
    queryFn: () => base44.entities.SatisfactionSurvey.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date))
  });

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.SatisfactionSurvey.create({
      ...form,
      project_id: activeProject?.id,
      company_id: companyId,
      client_contact_id: contactId,
      submitted_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_surveys"] });
      setSubmitted(true);
    }
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const avgScore = surveys.length > 0
    ? (surveys.reduce((sum, s) => sum + (s.overall_score || 0), 0) / surveys.length).toFixed(1)
    : null;

  const isValid = form.overall_score > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 pt-14 pb-20">
        <p className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-medium mb-1">
          Avaliação
        </p>
        <h1 className="text-[4.5rem] leading-[0.95] font-extralight text-slate-900 tracking-tight mb-3">
          Sua<br /><span className="text-[5.5rem]">Opinião</span>
        </h1>
        <p className="text-[0.9rem] text-slate-400 font-light leading-relaxed mb-3">
          Avalie a qualidade do nosso trabalho.
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5 space-y-4 pb-20">
        {/* Average Score */}
        {avgScore && (
          <div className="bg-white border border-amber-200 rounded-2xl p-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-amber-500">{avgScore}</p>
              <p className="text-xs text-slate-400 mt-1">média geral</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 mb-2">{surveys.length} avaliação{surveys.length !== 1 ? "ões" : ""} registrada{surveys.length !== 1 ? "s" : ""}</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <div key={n} className={`h-2 flex-1 rounded-full ${parseFloat(avgScore) >= n ? "bg-amber-400" : "bg-slate-200"}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New Survey Form */}
        {submitted ? (
          <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Obrigado pelo seu feedback!</h2>
            <p className="text-slate-500 text-sm">Sua avaliação foi enviada com sucesso. Ela é muito importante para continuarmos melhorando.</p>
            <Button
              onClick={() => { setSubmitted(false); setForm({ overall_score: 0, communication_score: 0, timeline_score: 0, quality_score: 0, result_score: 0, comment: "" }); }}
              variant="ghost"
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Enviar nova avaliação
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-slate-900 text-lg">Nova Avaliação</h2>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Nota geral do projeto (1–10)</p>
              <StarRating value={form.overall_score} onChange={v => setForm(f => ({ ...f, overall_score: v }))} size="lg" />
              {form.overall_score > 0 && (
                <p className="text-xs text-amber-600 mt-1 font-medium">Sua nota: {form.overall_score}/10</p>
              )}
            </div>

            <div className="space-y-4">
              {criteria.map(c => (
                <div key={c.key} className="flex items-center justify-between gap-4 py-3 border-t border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.label}</p>
                    <p className="text-xs text-slate-400">{c.desc}</p>
                  </div>
                  <StarRating
                    value={form[c.key]}
                    onChange={v => setForm(f => ({ ...f, [c.key]: v }))}
                  />
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Comentários (opcional)</p>
              <Textarea
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Compartilhe suas observações, sugestões ou elogios..."
                className="resize-none border-slate-200"
                rows={4}
              />
            </div>

            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!isValid || submitMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
            >
              {submitMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        )}

        {/* History */}
        {surveys.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-4">Histórico de Avaliações</h2>
            <div className="space-y-3">
              {surveys.map(s => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-lg font-bold text-amber-500">{s.overall_score}</span>
                      <span className="text-slate-400 text-sm">/10</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {s.submitted_at ? format(new Date(s.submitted_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""}
                    </span>
                  </div>
                  {s.comment && (
                    <div className="flex items-start gap-2 mb-3">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-600">{s.comment}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {criteria.map(c => s[c.key] ? (
                      <div key={c.key} className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-400 mb-1">{c.label}</p>
                        <p className="text-sm font-bold text-slate-700">{s[c.key]}/10</p>
                      </div>
                    ) : null)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}