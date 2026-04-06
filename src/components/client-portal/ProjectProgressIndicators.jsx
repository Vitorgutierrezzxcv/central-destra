import React from "react";
import { RadialBarChart, RadialBar, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Flame } from "lucide-react";
import { isAfter, isBefore, addDays, differenceInDays } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tarefas com prazo próximo (próximos 7 dias)
function getDueSoonTasks(tasks) {
  const now = new Date();
  const in7 = addDays(now, 7);
  return tasks.filter(t =>
    t.status !== "completed" &&
    t.end_date &&
    isAfter(new Date(t.end_date), now) &&
    isBefore(new Date(t.end_date), in7)
  );
}

// Tarefas atrasadas
function getOverdueTasks(tasks) {
  const now = new Date();
  return tasks.filter(t =>
    t.status !== "completed" &&
    t.end_date &&
    isBefore(new Date(t.end_date), now)
  );
}

const COLORS = {
  completed: "#10b981",
  in_progress: "#3b82f6",
  pending: "#e2e8f0",
};

function MiniDonut({ completed, inProgress, pending, total }) {
  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-28 h-28">
        <span className="text-slate-300 text-xs">Sem tarefas</span>
      </div>
    );
  }

  const data = [
    { name: "Concluídas", value: completed, color: COLORS.completed },
    { name: "Em andamento", value: inProgress, color: COLORS.in_progress },
    { name: "Pendentes", value: pending, color: COLORS.pending },
  ].filter(d => d.value > 0);

  const completedPct = Math.round((completed / total) * 100);

  return (
    <div className="relative w-28 h-28">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="65%" outerRadius="100%"
          startAngle={90} endAngle={-270}
          data={[
            { value: completedPct, fill: COLORS.completed },
            { value: 100 - completedPct, fill: COLORS.pending },
          ]}
        >
          <RadialBar dataKey="value" cornerRadius={4} background={false}>
            {[COLORS.completed, COLORS.pending].map((c, i) => (
              <Cell key={i} fill={c} />
            ))}
          </RadialBar>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-900">{completedPct}%</span>
        <span className="text-[10px] text-slate-400">concluído</span>
      </div>
    </div>
  );
}

function UrgencyBar({ label, count, color, bgColor, max }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={`text-xs font-bold ${color}`}>{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full ${bgColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ProjectProgressIndicators({ tasks, project }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const pending = tasks.filter(t => t.status === "pending").length;
  const dueSoon = getDueSoonTasks(tasks);
  const overdue = getOverdueTasks(tasks);

  const daysLeft = project?.estimated_end_date
    ? differenceInDays(new Date(project.estimated_end_date), new Date())
    : null;

  const urgencyMax = Math.max(total, 1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-slate-900">Indicadores do Projeto</h3>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Donut chart */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <MiniDonut completed={completed} inProgress={inProgress} pending={pending} total={total} />
          <div className="flex flex-col gap-1.5 text-xs">
            {[
              { label: "Concluídas", value: completed, dot: "bg-emerald-500" },
              { label: "Em andamento", value: inProgress, dot: "bg-blue-500" },
              { label: "Pendentes", value: pending, dot: "bg-slate-200" },
            ].map(({ label, value, dot }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-slate-500">{label}:</span>
                <span className="font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side metrics */}
        <div className="flex-1 space-y-5 w-full">
          {/* Urgência */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Distribuição de Tarefas</p>
            <UrgencyBar label="Concluídas" count={completed} color="text-emerald-600" bgColor="bg-emerald-500" max={urgencyMax} />
            <UrgencyBar label="Em andamento" count={inProgress} color="text-blue-600" bgColor="bg-blue-500" max={urgencyMax} />
            <UrgencyBar label="Pendentes" count={pending} color="text-slate-500" bgColor="bg-slate-300" max={urgencyMax} />
          </div>

          {/* Alertas */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 border ${overdue.length > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className={`w-3.5 h-3.5 ${overdue.length > 0 ? "text-rose-500" : "text-slate-400"}`} />
                <span className="text-xs font-semibold text-slate-600">Atrasadas</span>
              </div>
              <p className={`text-2xl font-bold ${overdue.length > 0 ? "text-rose-600" : "text-slate-400"}`}>{overdue.length}</p>
            </div>

            <div className={`rounded-xl p-3 border ${dueSoon.length > 0 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Flame className={`w-3.5 h-3.5 ${dueSoon.length > 0 ? "text-amber-500" : "text-slate-400"}`} />
                <span className="text-xs font-semibold text-slate-600">Vencem em 7 dias</span>
              </div>
              <p className={`text-2xl font-bold ${dueSoon.length > 0 ? "text-amber-600" : "text-slate-400"}`}>{dueSoon.length}</p>
            </div>
          </div>

          {/* Dias restantes */}
          {daysLeft !== null && (
            <div className={`flex items-center gap-3 rounded-xl p-3 border ${
              daysLeft < 0 ? "bg-rose-50 border-rose-200" :
              daysLeft < 14 ? "bg-amber-50 border-amber-200" :
              "bg-blue-50 border-blue-100"
            }`}>
              <Clock className={`w-4 h-4 flex-shrink-0 ${
                daysLeft < 0 ? "text-rose-500" :
                daysLeft < 14 ? "text-amber-500" : "text-blue-500"
              }`} />
              <div>
                <p className="text-xs text-slate-500">Prazo final</p>
                <p className={`text-sm font-semibold ${
                  daysLeft < 0 ? "text-rose-700" :
                  daysLeft < 14 ? "text-amber-700" : "text-blue-700"
                }`}>
                  {daysLeft < 0
                    ? `Atrasado ${Math.abs(daysLeft)} dias`
                    : daysLeft === 0
                    ? "Vence hoje!"
                    : `${daysLeft} dias restantes`}
                  {project.estimated_end_date && (
                    <span className="font-normal text-slate-400 ml-1">
                      · {format(new Date(project.estimated_end_date), "dd/MM/yyyy")}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Prazos próximos */}
          {dueSoon.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Vencendo em breve</p>
              <div className="space-y-1.5">
                {dueSoon.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="flex-1 text-xs text-slate-700 truncate">{t.client_facing_title || t.title}</span>
                    <span className="text-[10px] text-amber-600 font-medium flex-shrink-0">
                      {format(new Date(t.end_date), "dd/MM")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}