export type Priority = "low" | "medium" | "high";

export type Category =
  | "робота"
  | "побут"
  | "здоров'я"
  | "фінанси"
  | "навчання"
  | "інше";

export const CATEGORIES: Category[] = [
  "робота",
  "побут",
  "здоров'я",
  "фінанси",
  "навчання",
  "інше",
];

export const PRIORITIES: Priority[] = ["low", "medium", "high"];

/** Задача як її повертає /api/parse (без клієнтських полів). */
export interface ParsedTask {
  title: string;
  due_date: string | null; // YYYY-MM-DD
  time: string | null; // HH:MM
  priority: Priority;
  category: string;
  notes: string | null;
  estimate_minutes: number | null;
}

/** Задача у клієнтському сторі (чернетка або збережена). */
export interface Task extends ParsedTask {
  id: string;
  done: boolean;
  createdAt: number;
}

export function makeId(): string {
  // Достатньо для клієнтського прототипу; на БД замінимо на server-side id.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Перетворює розібрану задачу з API на клієнтську чернетку. */
export function toTask(parsed: ParsedTask): Task {
  return {
    ...parsed,
    id: makeId(),
    done: false,
    createdAt: Date.now(),
  };
}
