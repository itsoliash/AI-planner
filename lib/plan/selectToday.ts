import type { Task } from "@/lib/types";

const DEFAULT_ESTIMATE_MIN = 20;
const BUDGET_MINUTES = 240;
const MAX_CARDS = 7;

function estimate(t: Task): number {
  return t.estimate_minutes ?? DEFAULT_ESTIMATE_MIN;
}

const PRIORITY_RANK: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** Термінові (high) задачі — першими в списку, решта лишається як була. */
function sortUrgentFirst(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

export function selectToday(
  tasks: Task[],
  todayISO: string
): { overdue: Task[]; today: Task[] } {
  const active = tasks.filter((t) => !t.done);

  const overdue = active.filter(
    (t) => t.due_date !== null && t.due_date < todayISO
  );
  const dueToday = active.filter((t) => t.due_date === todayISO);
  const highNoDate = active.filter(
    (t) => t.due_date === null && t.priority === "high"
  );

  // Якщо прострочених забагато — показуємо тільки їх, нічого не додаємо.
  if (overdue.length > MAX_CARDS) {
    return { overdue: sortUrgentFirst(overdue), today: [] };
  }

  const today: Task[] = [];
  let usedMinutes = 0;
  let usedCards = overdue.length;

  for (const t of [...dueToday, ...highNoDate]) {
    if (usedCards >= MAX_CARDS) break;
    const cost = estimate(t);
    if (usedMinutes + cost > BUDGET_MINUTES) continue;
    today.push(t);
    usedMinutes += cost;
    usedCards += 1;
  }

  return { overdue: sortUrgentFirst(overdue), today: sortUrgentFirst(today) };
}

/**
 * Рекомендації для порожнього «Сьогодні» (ТЗ 8.1/8.2): high → найближчий
 * дедлайн → найстаріші за створенням, максимум 3.
 */
export function selectRecommendations(tasks: Task[]): Task[] {
  const active = tasks.filter((t) => !t.done);
  const sorted = [...active].sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (b.priority === "high" && a.priority !== "high") return 1;
    if (a.due_date && b.due_date) return a.due_date < b.due_date ? -1 : 1;
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return a.createdAt - b.createdAt;
  });
  return sorted.slice(0, 3);
}
