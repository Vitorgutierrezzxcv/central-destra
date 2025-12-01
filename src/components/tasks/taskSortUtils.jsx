import { parseISO, startOfDay, isBefore, isSameDay } from "date-fns";

/**
 * Ordena tarefas por urgência: 
 * 1. Atrasadas primeiro (mais antiga primeiro)
 * 2. Por data de término (mais próxima primeiro)
 * 3. Tarefas sem data vão para o final
 * 4. Concluídas sempre no final
 */
export function sortTasksByUrgency(tasks) {
  const now = startOfDay(new Date());
  
  return [...tasks].sort((a, b) => {
    // Concluídas sempre no final
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.status === 'completed' && b.status === 'completed') {
      // Entre concluídas, mais recente primeiro
      return new Date(b.updated_date || 0) - new Date(a.updated_date || 0);
    }

    const aDate = a.end_date ? startOfDay(parseISO(a.end_date)) : null;
    const bDate = b.end_date ? startOfDay(parseISO(b.end_date)) : null;

    // Tarefas sem data vão para o final (entre não-concluídas)
    if (!aDate && bDate) return 1;
    if (aDate && !bDate) return -1;
    if (!aDate && !bDate) {
      // Entre tarefas sem data, ordenar por prioridade
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    }

    // Ordenar por data (mais urgente/antiga primeiro)
    return aDate - bDate;
  });
}

/**
 * Verifica se uma tarefa está atrasada
 */
export function isTaskOverdue(task) {
  if (task.status === 'completed' || !task.end_date) return false;
  const now = startOfDay(new Date());
  const endDate = startOfDay(parseISO(task.end_date));
  return isBefore(endDate, now) && !isSameDay(endDate, now);
}