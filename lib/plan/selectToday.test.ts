import { describe, it, expect } from "vitest";
import { selectToday, selectRecommendations } from "./selectToday";
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

  it("виводить термінові (high) задачі першими в обох групах", () => {
    const tasks = [
      makeTask({ id: "overdue-low", due_date: "2026-07-20", priority: "low" }),
      makeTask({ id: "overdue-high", due_date: "2026-07-21", priority: "high" }),
      makeTask({ id: "today-medium", due_date: "2026-07-23", priority: "medium" }),
      makeTask({ id: "today-high", due_date: "2026-07-23", priority: "high" }),
    ];
    const result = selectToday(tasks, "2026-07-23");
    expect(result.overdue.map((t) => t.id)).toEqual(["overdue-high", "overdue-low"]);
    expect(result.today.map((t) => t.id)).toEqual(["today-high", "today-medium"]);
  });
});

describe("selectRecommendations", () => {
  it("сортує high -> найближчий дедлайн -> найстаріші, максимум 3", () => {
    const tasks = [
      makeTask({ id: "old", createdAt: 1 }),
      makeTask({ id: "high", priority: "high", createdAt: 5 }),
      makeTask({ id: "soon", due_date: "2026-08-01", createdAt: 3 }),
      makeTask({ id: "later", due_date: "2026-09-01", createdAt: 4 }),
    ];
    const result = selectRecommendations(tasks);
    expect(result.map((t) => t.id)).toEqual(["high", "soon", "later"]);
  });
});
