import { describe, it, expect } from "vitest";
import { selectToday } from "./selectToday";
import type { Task } from "@/lib/types";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? Math.random().toString(),
    title: overrides.title ?? "Задача",
    due_date: overrides.due_date ?? null,
    time: overrides.time ?? null,
    priority: overrides.priority ?? "medium",
    category: overrides.category ?? "інше",
    notes: overrides.notes ?? null,
    estimate_minutes: overrides.estimate_minutes ?? null,
    done: overrides.done ?? false,
    createdAt: overrides.createdAt ?? Date.now(),
  };
}

describe("selectToday", () => {
  it("бере всі прострочені задачі повністю, незалежно від бюджету", () => {
    const tasks = [
      makeTask({ id: "1", due_date: "2026-07-20", estimate_minutes: 200 }),
      makeTask({ id: "2", due_date: "2026-07-21", estimate_minutes: 200 }),
    ];
    const result = selectToday(tasks, "2026-07-23");
    expect(result.overdue.map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("не перевищує бюджет 240 хвилин серед задач на сьогодні/high", () => {
    const tasks = [
      makeTask({ id: "a", due_date: "2026-07-23", estimate_minutes: 150 }),
      makeTask({ id: "b", due_date: "2026-07-23", estimate_minutes: 150 }),
      makeTask({ id: "c", due_date: "2026-07-23", estimate_minutes: 50 }),
    ];
    const result = selectToday(tasks, "2026-07-23");
    const totalMinutes = result.today.reduce(
      (sum, t) => sum + (t.estimate_minutes ?? 20),
      0
    );
    expect(totalMinutes).toBeLessThanOrEqual(240);
    expect(result.today.map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("не бере більше 7 карток на сьогодні", () => {
    const tasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({ id: `t${i}`, due_date: "2026-07-23", estimate_minutes: 5 })
    );
    const result = selectToday(tasks, "2026-07-23");
    expect(result.today.length).toBe(7);
  });

  it("рахує задачі без estimate_minutes як 20 хвилин", () => {
    const tasks = [
      makeTask({ id: "x", due_date: "2026-07-23", estimate_minutes: null }),
    ];
    const result = selectToday(tasks, "2026-07-23");
    expect(result.today.map((t) => t.id)).toEqual(["x"]);
  });

  it("якщо прострочених більше 7 — показує тільки їх, без додавань", () => {
    const overdueTasks = Array.from({ length: 8 }, (_, i) =>
      makeTask({ id: `o${i}`, due_date: "2026-07-20" })
    );
    const todayTask = makeTask({ id: "today1", due_date: "2026-07-23" });
    const result = selectToday([...overdueTasks, todayTask], "2026-07-23");
    expect(result.overdue.length).toBe(8);
    expect(result.today.length).toBe(0);
  });
});
