## Task 2: `selectToday.ts` — чиста функція вибірки (TDD)

**Файли:**
- Create: `lib/plan/selectToday.ts`
- Test: `lib/plan/selectToday.test.ts` (замінює smoke-тест з Task 0)

**Interfaces:**
- Consumes: `Task` з `lib/types.ts` (`due_date`, `time`, `priority`, `estimate_minutes`, `done`).
- Produces: `selectToday(tasks: Task[], todayISO: string): { overdue: Task[]; today: Task[] }` — споживається в Task 8 (`PlanStage`/`TodayList`).

Правила з ТЗ розділу 7: усі прострочені (без обмежень), потім due today, потім `priority: high` без дати — доки бюджет (240 хв, макс 7 карток) не вичерпано; без оцінки — 20 хв; якщо прострочених >7 — показати тільки їх.

- [ ] **Крок 1: Написати тест на «тільки прострочені»**

`lib/plan/selectToday.ts` ще не існує — тест впаде на імпорті, це очікувано.

```typescript
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
});
```

- [ ] **Крок 2: Запустити тест і переконатись, що падає**

Run: `npm test`
Expected: FAIL — `Cannot find module './selectToday'`

- [ ] **Крок 3: Мінімальна імплементація для проходження першого тесту**

`lib/plan/selectToday.ts`:
```typescript
import type { Task } from "@/lib/types";

const DEFAULT_ESTIMATE_MIN = 20;
const BUDGET_MINUTES = 240;
const MAX_CARDS = 7;

function estimate(t: Task): number {
  return t.estimate_minutes ?? DEFAULT_ESTIMATE_MIN;
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
    return { overdue, today: [] };
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

  return { overdue, today };
}
```

- [ ] **Крок 4: Запустити тест і переконатись, що проходить**

Run: `npm test`
Expected: PASS

- [ ] **Крок 5: Тест на бюджет 240 хв**

Додати в `selectToday.test.ts`:
```typescript
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
```

Run: `npm test` → Expected: PASS (жадібний прохід по порядку масиву: `a` (150) влазить, `b` (150) не влазить бо 150+150>240, `c` (50) влазить бо 150+50=200).

- [ ] **Крок 6: Тест на ліміт 7 карток**

```typescript
  it("не бере більше 7 карток на сьогодні", () => {
    const tasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({ id: `t${i}`, due_date: "2026-07-23", estimate_minutes: 5 })
    );
    const result = selectToday(tasks, "2026-07-23");
    expect(result.today.length).toBe(7);
  });
```

Run: `npm test` → Expected: PASS

- [ ] **Крок 7: Тест на задачі без оцінки часу (рахуються як 20 хв)**

```typescript
  it("рахує задачі без estimate_minutes як 20 хвилин", () => {
    const tasks = [
      makeTask({ id: "x", due_date: "2026-07-23", estimate_minutes: null }),
    ];
    const result = selectToday(tasks, "2026-07-23");
    expect(result.today.map((t) => t.id)).toEqual(["x"]);
  });
```

Run: `npm test` → Expected: PASS

- [ ] **Крок 8: Тест на «прострочених більше 7 — нічого не додаємо»**

```typescript
  it("якщо прострочених більше 7 — показує тільки їх, без додавань", () => {
    const overdueTasks = Array.from({ length: 8 }, (_, i) =>
      makeTask({ id: `o${i}`, due_date: "2026-07-20" })
    );
    const todayTask = makeTask({ id: "today1", due_date: "2026-07-23" });
    const result = selectToday([...overdueTasks, todayTask], "2026-07-23");
    expect(result.overdue.length).toBe(8);
    expect(result.today.length).toBe(0);
  });
```

Run: `npm test` → Expected: PASS

- [ ] **Крок 9: Commit**

```bash
git add lib/plan/selectToday.ts lib/plan/selectToday.test.ts
git commit -m "feat: add selectToday with budget/limit rules and tests"
```

---

