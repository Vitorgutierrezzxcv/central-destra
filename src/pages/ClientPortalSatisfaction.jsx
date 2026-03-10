import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, CheckCircle2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const criteria = [
  { key: "communication_score", label: "Comunicação", desc: "Clareza e qualidade da comunicação da equipe" },
  { key: "timeline_score", label: "Prazos", desc: "Cumprimento das datas acordadas" },
  { key: "quality_score", label: "Qualidade", desc: "Qualidade das entregas realizadas" },
  { key: "result_score", label: "Resultados", desc: "Alinhamento com seus objetivos" },
];

function StarRating({ value, onChange, size = "md" }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "lg" ? "w-8 h-8" : "w-6 h-6";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
        <button
          key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange && onChange(n)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`${sz} transition-colors ${(hovered || value) >= n ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ClientPortalSatisfaction() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ overall_score: 0, communication_score: 0, timeline_score: 0, quality_score: 0, result_score: 0, comment: "" });
  const [submitted, setSubmitted] = useState(false);
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

  const { data: surveys = [] } = useQuery({
    queryKey: ["client_surveys", activeProject?.id],
    queryFn: () => base44.entities.SatisfactionSurvey.filter({ project_id: activeProject.id }),
    enabled: !!activeProject?.id,
    select: d => [...d].sort((a, b) => new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date))
  });

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.SatisfactionSurvey.create({
      ...form,
      project_id: activeProject.id,
      company_id: user.company_id,
      submitted_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_surveys"] });
      setSubmitted(true);
    }
  });

  const avgScore = surveys.length > 0
    ? (surveys.reduce((sum, s) => sum + (s.overall_score || 0), 0) / surveys.length).toFixed(1)
    : null;

  const isValid = form.overall_score > 0;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="border-b border-white/5 bg-[#0D1221] px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portal do Cliente</p>
          <h1 className="text-2xl font-bold text-white">Avaliação de Satisfação</h1>
          <p className="text-slate-400 text-sm mt-1">Sua opinião é muito importante para nós.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Average Score */}
        {avgScore && (
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-amber-400">{avgScore}</p>
              <p className="text-xs text-slate-400 mt-1">média geral</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-300 mb-1">{surveys.length} avaliação{surveys.length !== 1 ? "ões" : ""} registrada{surveys.length !== 1 ? "s" : ""}</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <div key={n} className={`h-2 flex-1 rounded-full ${parseFloat(avgScore) >= n ? "bg-amber-400" : "bg-white/10"}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New Survey Form */}
        {submitted ? (
          <div className="bg-[#0D1221] border border-emerald-500/20 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-2">Obrigado pelo seu feedback!</h2>
            <p className="text-slate-400 text-sm">Sua avaliação foi enviada com sucesso. Ela é muito importante para continuarmos melhorando.</p>
            <Button onClick={() => { setSubmitted(false); setForm({ overall_score: 0, communication_score: 0, timeline_score: 0, quality_score: 0, result_score: 0, comment: "" }); }}
              variant="ghost" className="mt-4 text-blue-400 hover:text-blue-300">
              Enviar nova avaliação
            </Button>
          </div>
        ) : (
          <div className="bg-[#0D1221] border border-white/5 rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-white text-lg">Nova Avaliação</h2>

            <div>
              <p className="text-sm font-medium text-slate-300 mb-3">Nota geral do projeto (1–10)</p>
              <StarRating value={form.overall_score} onChange={v => setForm(f => ({ ...f, overall_score: v }))} size="lg" />
              {form.overall_score > 0 && (
                <p className="text-xs text-amber-400 mt-1">Sua nota: {form.overall_score}/10</p>
              )}
            </div>

            <div className="space-y-4">
              {criteria.map(c => (
                <div key={c.key} className="flex items-center justify-between gap-4 py-3 border-t border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{c.label}</p>
                    <p className="text-xs text-slate-500">{c.desc}</p>
                  </div>
                  <StarRating
                    value={form[c.key]}
                    onChange={v => setForm(f => ({ ...f, [c.key]: v }))}
                  />
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Comentários</p>
              <Textarea
                value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Compartilhe suas observações, sugestões ou elogios..."
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
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
            <h2 className="font-semibold text-white mb-4">Histórico de Avaliações</h2>
            <div className="space-y-3">
              {surveys.map(s => (
                <div key={s.id} className="bg-[#0D1221] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-lg font-bold text-amber-400">{s.overall_score}</span>
                      <span className="text-slate-500 text-sm">/10</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {s.submitted_at ? format(new Date(s.submitted_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""}
                    </span>
                  </div>
                  {s.comment && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-400">{s.comment}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {criteria.map(c => s[c.key] ? (
                      <div key={c.key} className="bg-white/3 rounded-lg p-2 text-center">
                        <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                        <p className="text-sm font-bold text-white">{s[c.key]}/10</p>
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