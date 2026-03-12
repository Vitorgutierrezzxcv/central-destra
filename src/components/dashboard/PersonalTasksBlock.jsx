import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Check, Trash2, RefreshCw, X } from "lucide-react";

const FREQ_LABELS = { daily: "Diário", weekly: "Semanal", monthly: "Mensal" };

export default function PersonalTasksBlock({ userEmail }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", due_date: "", is_recurring: false, recurrence_frequency: "weekly", notes: "" });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["personalTasks", userEmail],
    queryFn: () => base44.entities.PersonalTask.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["personalTasks", userEmail] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PersonalTask.create({ ...data, user_email: userEmail }),
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ title: "", due_date: "", is_recurring: false, recurrence_frequency: "weekly", notes: "" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_done }) => base44.entities.PersonalTask.update(id, { is_done }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonalTask.delete(id),
    onSuccess: invalidate,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = { title: form.title, notes: form.notes, due_date: form.due_date || undefined, is_recurring: form.is_recurring };
    if (form.is_recurring) payload.recurrence_frequency = form.recurrence_frequency;
    createMutation.mutate(payload);
  };

  const pending = tasks.filter(t => !t.is_done);
  const done = tasks.filter(t => t.is_done);

  return (
    <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-normal text-[#131A20]">Tarefas Pessoais</h2>
          <p className="text-xs text-[#456C8D] font-light mt-0.5">Visíveis apenas para você</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F7F7F7] hover:bg-[#EAEAEA] transition-colors"
        >
          {showForm ? <X className="w-4 h-4 text-[#456C8D]" /> : <Plus className="w-4 h-4 text-[#456C8D]" />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 space-y-3 bg-[#F8F9FB] rounded-xl p-4 border border-[#EAEAEA]">
          <input
            autoFocus
            placeholder="Título da tarefa..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full text-sm font-light bg-white border border-[#EAEAEA] rounded-lg px-3 py-2 outline-none focus:border-[#6FA6FF] text-[#131A20] placeholder:text-[#AABCCC]"
          />
          <input
            type="date"
            value={form.due_date}
            onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
            className="w-full text-sm font-light bg-white border border-[#EAEAEA] rounded-lg px-3 py-2 outline-none focus:border-[#6FA6FF] text-[#131A20]"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-light text-[#456C8D] cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_recurring}
                onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
                className="rounded"
              />
              Recorrente
            </label>
            {form.is_recurring && (
              <select
                value={form.recurrence_frequency}
                onChange={e => setForm(f => ({ ...f, recurrence_frequency: e.target.value }))}
                className="text-sm font-light bg-white border border-[#EAEAEA] rounded-lg px-2 py-1 outline-none text-[#131A20]"
              >
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-[#456C8D] px-3 py-1.5 rounded-lg hover:bg-[#EAEAEA] transition-colors">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="text-xs bg-[#131A20] text-white px-3 py-1.5 rounded-lg hover:bg-[#456C8D] transition-colors">
              {createMutation.isPending ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-xs text-[#456C8D] font-light">Carregando...</p>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Check className="w-8 h-8 text-[#EAEAEA]" />
          <p className="text-xs text-[#456C8D] font-light">Nenhuma tarefa pessoal</p>
        </div>
      ) : (
        <div className="space-y-1">
          {pending.map(task => (
            <TaskRow key={task.id} task={task} onToggle={toggleMutation.mutate} onDelete={deleteMutation.mutate} />
          ))}
          {done.length > 0 && (
            <>
              <p className="text-xs text-[#AABCCC] font-light pt-3 pb-1">Concluídas</p>
              {done.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleMutation.mutate} onDelete={deleteMutation.mutate} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }) {
  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl group hover:bg-[#F8F9FB] transition-colors ${task.is_done ? "opacity-50" : ""}`}>
      <button
        onClick={() => onToggle({ id: task.id, is_done: !task.is_done })}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.is_done ? "bg-[#131A20] border-[#131A20]" : "border-[#EAEAEA] hover:border-[#6FA6FF]"}`}
      >
        {task.is_done && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-light text-[#131A20] truncate ${task.is_done ? "line-through" : ""}`}>{task.title}</p>
        <div className="flex items-center gap-2">
          {task.due_date && <p className="text-xs text-[#456C8D] font-light">{task.due_date}</p>}
          {task.is_recurring && (
            <span className="flex items-center gap-1 text-xs text-[#6FA6FF] font-light">
              <RefreshCw className="w-2.5 h-2.5" />
              {FREQ_LABELS[task.recurrence_frequency] || "Recorrente"}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-400" />
      </button>
    </div>
  );
}