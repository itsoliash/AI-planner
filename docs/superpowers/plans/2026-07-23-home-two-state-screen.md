# Головний екран «План» (Фаза 0, редизайн №2) — план реалізації

> **Для виконавця:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (рекомендовано) або superpowers:executing-plans. Кроки — чекбокси `- [ ]`.
>
> **Правило проєкту (не змінювати):** жодного файлу не видаляти самостійно. Тільки заміна вмісту. Видалення — окремим підтвердженням від Ольги.

**Мета:** злити Capture і Plan в один екран `/` із двома станами (замість трьох роутів), перенести редагування в картку задачі, додати вибірку «Сьогодні» з бюджетом і докований мікрофон.

**Джерело:** ТЗ «головний екран «План» (Фаза 0, редизайн №2)», 23.07.2026. Розділи 2 (токени), 4.3–4.4, 5 лишаються чинними без змін.

**Архітектура:** один клієнтський компонент-оркестратор (`HomeScreen`) керує кінцевим автоматом станів (`capture | recording | processing | plan | error`) і рендерить дві композиції (`CaptureStage`, `PlanStage`), що ділять один фізичний `CaptureDock`. Переходи — Framer Motion (`layoutId`) для спільного елемента кнопки, каскад появи карток — `staggerChildren`.

**Стек:** Next.js 14.2.5 (App Router, без route groups — `app/page.tsx` лишається коренем, `app/(app)` з ТЗ не існує і не створюється — немає потреби, роут один), React 18, TypeScript, Tailwind, Zustand (persist), OpenRouter через `/api/parse`, Groq Whisper через `/api/stt`. Тестування — **Vitest** (рекомендація: нативний ESM, швидкий старт без конфігурації Babel, добре ладнає з Next.js 14; Jest тут зайва вага для проєкту без жодного тесту досі).

## Global Constraints

- Кольори/типографіка/відступи/радіуси/тіні — тільки з CSS-змінних у `app/globals.css :root` / класів Tailwind з `tailwind.config.ts`. Жодного хардкод-хексу в компонентах.
- Тач-таргети ≥44×44px.
- `textarea`/`input` — шрифт ≥16px (iOS zoom).
- Нові токени руху з ТЗ 5.4: `--dur-morph: 360ms`, `--dur-stagger: 40ms` — додати в `app/globals.css :root` і в `tailwind.config.ts` (`transitionDuration.morph`, `transitionDuration.stagger`).
- Українська мова у всіх текстах інтерфейсу.
- Контракти `/api/stt` і `/api/parse` (реальні назви роутів у цьому репо — **не** `/api/plan`, як у первинній архітектурі, якої тут нема) — не ламати без окремого рішення (див. Рішення D2 нижче).

---

## 0. Розбіжності ТЗ ⟷ реальний код — прочитати перед стартом

ТЗ писалося під архітектуру з route groups (`app/(app)/...`), окремим `/review/[captureId]`, Supabase-таблицями `captures`/`tasks`. Реальний код — простіший:

1. **`/review` уже видалено сьогоднішнім комітом** (`aacfa37`, 23.07). Інлайн-редагування в `TaskCard` уже частково існує — тап по картці відкриває форму редагування всіх полів одразу (не по-польово, як вимагає ТЗ 6.2). Це не «створити з нуля», а **дороблення до по-польового** редагування.
2. **Роутів `app/(app)/page.tsx`, `/capture`, `/tasks` не існує.** Є єдиний `app/page.tsx` в корені. План нижче лишає структуру такою — редиректи `/capture → /?capture=1` не потрібні, бо `/capture` як роут ніколи не існував.
3. **Модель задачі не має `estimate_minutes` і єдиного `due_at`.** Є `due_date` (YYYY-MM-DD) і `time` (HH:MM) окремими полями, without тривалості. Вибірка «Сьогодні» з ТЗ розділ 7 (бюджет 240 хв, ліміт 7) без оцінки часу не рахується. → Рішення D1.
4. **Немає `tags`, є один `category`** (одне з 6 фіксованих слів). ТЗ 6.1 показує «чипи тегів» (множина). → Рішення D3.
5. **Немає прапорця «низька впевненість»** в LLM-відповіді — ані в типах, ані в промпті `/api/parse`. ТЗ 6.3 вимагає пунктирне підкреслення. → Рішення D4 (уже раз відкладено 22.07 — переношу те саме рішення, тепер явно).
6. **`useHydrated` у `lib/store/tasks.ts` очищає всі задачі при новій сесії браузера** (не при F5, а при новій вкладці/перезапуску браузера). Це продуктове рішення 22.07, не з цього ТЗ, але воно **прямо суперечить** логіці першого заходу з розділу 3.1 («людина, яка повернулась через місяць, бачить капчу, а не порожній Today») — з поточною поведінкою вона й так завжди бачить капчу при новій сесії, незалежно від історії. → Рішення D5.
7. **Framer Motion не встановлено.** Ти обрав(-ла) його в деталях плану — додається як нова залежність (Task 0).
8. **Тестів немає жодних.** Vitest додається з нуля (Task 0).
9. **`Logo.tsx` уже є SVG лише знака** (без назви — назва рендериться окремим `<span>` у `Brand.tsx`). Пункт 12.6 ТЗ фактично вже виконаний, лишається тільки додати керовані розміри 32/88px через проп `size` (він уже є).

---

## Рішення D1–D9 — підтверджено 23.07.2026

Ольга підтвердила рекомендовані дефолти для всіх дев'яти пунктів. Блокери «не починати без підтвердження» в Task 1 і Task 9 знято.

| № | Питання | Рішення (фінальне) | Де реалізується |
|---|---|---|---|
| D1 | `estimate_minutes` немає в даних. | **Додаємо поле в схему `/api/parse`** — LLM оцінює хвилини. Без цього бюджет «Сьогодні» (розділ 7 ТЗ) не має сенсу. | Task 1 |
| D2 | Чи додавання поля — заборонена зміна контракту API (розділ 11 ТЗ)? | **Ні.** Розділ 11 забороняв чіпати контракти архітектури з Supabase (`/api/plan`, таблиці), якої тут нема. `/api/parse` — прототипний, вільний для розширення полями. | Task 1 |
| D3 | Тегів (масив) немає, є один `category`. | **`category` як єдиний чип.** Задовольняє 6.1 візуально мінімальною зміною; повноцінні multi-tags — поза цим ТЗ. | Task 6 |
| D4 | «Низька впевненість» (6.3) вимагає confidence-прапорця з LLM, якого нема. | **Відкладено в v1**, як і 22.07 — поза скоупом без зміни `/api/parse`. | Task 6 |
| D5 | Очищення задач на нову сесію браузера (`useHydrated`) конфліктує з логікою «порожній беклог = capture». | **Лишаємо автоочищення як є.** Причина: акаунтів немає, тож без нього задачі різних людей на спільному пристрої змішувались би в одному `localStorage`. Наслідок (прийнятий свідомо): вкладка «Сьогодні» не переживає нову сесію браузера — це нормально до появи акаунтів, повернутись до питання разом із автентифікацією. | — (код `useHydrated` не змінюється) |
| D6 (=ТЗ 12.1) | Перший захід = порожній беклог чи прапорець `hasCompletedOnboarding`? | **Порожній беклог**, як у самому ТЗ. Узгоджено з D5. | Task 9 |
| D7 (=ТЗ 12.3) | Решта задач у «Всі задачі» — тихо чи з лічильником? | **Тихо**, без лічильника й банера. | Task 8 |
| D8 (=ТЗ 12.4) | Морф кнопки мікрофон↔стрілка в доці чи дві окремі кнопки? | **Морф**, кросфейд іконок 140ms. | Task 5 |
| D9 (=ТЗ 12.5) | Framer Motion vs View Transitions vs ручний FLIP. | **Framer Motion.** | Task 0, Task 10 |

---

## Task 0: Інфраструктура — Vitest + Framer Motion

**Файли:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/plan/selectToday.test.ts` (порожній smoke-тест, наповнюється в Task 2)

**Interfaces:** немає (чисте налаштування тулінгу).

- [ ] **Крок 1: Встановити залежності**

```bash
npm install framer-motion
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Крок 2: Створити конфіг Vitest**

`vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Крок 3: Додати скрипт тестів у `package.json`**

У `"scripts"` додати:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Крок 4: Smoke-тест, щоб перевірити конфіг**

`lib/plan/selectToday.test.ts`:
```typescript
import { describe, it, expect } from "vitest";

describe("vitest smoke test", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Крок 5: Запустити й перевірити**

Run: `npm test`
Expected: `1 passed`

- [ ] **Крок 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/plan/selectToday.test.ts
git commit -m "chore: add Vitest and Framer Motion"
```

---

## Task 1: Модель даних — `estimate_minutes` (Рішення D1/D2 підтверджено)

**Файли:**
- Modify: `lib/types.ts`
- Modify: `app/api/parse/route.ts`

**Interfaces:**
- Produces: `ParsedTask.estimate_minutes: number | null`, `Task.estimate_minutes: number | null` — використовується в Task 2 (`selectToday`) і Task 6 (картка).

- [ ] **Крок 1: Додати поле в типи**

У `lib/types.ts`, у `ParsedTask` (після `category`) і автоматично успадковується в `Task`:
```typescript
export interface ParsedTask {
  title: string;
  due_date: string | null;
  time: string | null;
  priority: Priority;
  category: string;
  notes: string | null;
  estimate_minutes: number | null; // орієнтовний час у хвилинах, крок 5
}
```

- [ ] **Крок 2: Оновити системний промпт `/api/parse`**

У `app/api/parse/route.ts`, у `buildSystemPrompt`, додати в список полів (після `category`):
```
  - "estimate_minutes": орієнтовна тривалість виконання в хвилинах, кратно 5 (число) або null, якщо оцінити неможливо
```

І в інтерфейс `TaskItem` у тому ж файлі додати:
```typescript
interface TaskItem {
  title: string;
  due_date: string | null;
  time: string | null;
  priority: "low" | "medium" | "high";
  category: string;
  notes: string | null;
  estimate_minutes: number | null;
}
```

- [ ] **Крок 3: Ручна перевірка**

Run: `npm run dev`, надиктувати або вставити приклад із `EXAMPLE` у `app/page.tsx`, натиснути «Розібрати».
Expected: у консолі мережі (`/api/parse` response) кожна задача має поле `estimate_minutes` (число або `null`), білд не падає (`npm run build`).

- [ ] **Крок 4: Commit**

```bash
git add lib/types.ts app/api/parse/route.ts
git commit -m "feat: add estimate_minutes to task model and parse prompt"
```

---

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

## Task 3: `MicButton` — виділити в окремий компонент з розмірами `dock`/`full`

Зараз кнопка мікрофона — інлайн JSX всередині `app/page.tsx` (клас `.mic-btn`). Виносимо в компонент, готовий приймати `layoutId` для Task 10.

**Файли:**
- Create: `components/capture/MicButton.tsx`
- Modify: `app/page.tsx` (замінити інлайн-кнопку на `<MicButton />`, поведінка не змінюється в цій задачі)

**Interfaces:**
- Produces:
```typescript
type MicButtonSize = "dock" | "full";
type MicButtonVisualState = "idle" | "recording" | "processing";

interface MicButtonProps {
  size: MicButtonSize;
  state: MicButtonVisualState;
  onClick: () => void;
  disabled?: boolean;
  elapsedMs?: number; // для підпису таймера в стані recording, тільки size="full"
}
```
- Consumes у Task 10: `layoutId="mic-button"` додається пізніше через Framer Motion `motion.button` — у цій задачі компонент ще звичайний `<button>`, без анімаційної бібліотеки (щоб ізолювати ризик рефакторингу від ризику анімації).

- [ ] **Крок 1: Створити компонент, перенісши розмітку 1:1 з поточного `app/page.tsx`**

`components/capture/MicButton.tsx`:
```tsx
import UnwindIndicator from "@/components/capture/UnwindIndicator";

export type MicButtonSize = "dock" | "full";
export type MicButtonVisualState = "idle" | "recording" | "processing";

interface MicButtonProps {
  size: MicButtonSize;
  state: MicButtonVisualState;
  onClick: () => void;
  disabled?: boolean;
  processingLabel?: string;
}

export default function MicButton({
  size,
  state,
  onClick,
  disabled,
  processingLabel,
}: MicButtonProps) {
  const sizeClass = size === "dock" ? "mic-btn-dock" : "";
  return (
    <button
      type="button"
      className={`mic-btn ${state} ${sizeClass}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={state === "recording" ? "Зупинити запис" : "Почати запис"}
    >
      {state === "processing" ? (
        <div className="mic-unwind">
          <UnwindIndicator />
          {processingLabel && (
            <div className="mic-unwind-text">
              <span className="mic-unwind-badge">{processingLabel}</span>
            </div>
          )}
        </div>
      ) : (
        <MicIcon active={state === "recording"} />
      )}
    </button>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {active ? (
        <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />
      ) : (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      )}
    </svg>
  );
}
```

- [ ] **Крок 2: Додати CSS для розміру `dock` у `app/globals.css`**

Додати після правил `.mic-btn.compact`:
```css
/* Розмір кнопки в доці (ТЗ 4.3) — 56px, завжди однаковий, не залежить від vw */
.mic-btn-dock {
  width: 56px;
  height: 56px;
  min-width: 56px;
  min-height: 56px;
  max-width: 56px;
  max-height: 56px;
}
```

- [ ] **Крок 3: Замінити інлайн-кнопку в `app/page.tsx` на компонент**

У `app/page.tsx` видалити функцію `MicIcon` (переїхала в `MicButton.tsx`) і замінити блок `<button className="mic-btn ...">...</button>` на:
```tsx
<MicButton
  size="full"
  state={isProcessing ? "processing" : voiceState}
  onClick={voiceState === "recording" ? stopRecording : startRecording}
  disabled={!voiceSupported || isProcessing}
  processingLabel={
    voiceState === "transcribing" ? "Розплутую\nхаос…." : "Мотаю\nв план…."
  }
/>
```
Імпорт: `import MicButton from "@/components/capture/MicButton";`

Примітка: `processingLabel` як багаторядковий текст — у самому компоненті рендерити з `whiteSpace: "pre-line"` в inline style на `<span>`, бо `\n` у JSX-тексті не переноситься автоматично:
```tsx
<span className="mic-unwind-badge" style={{ whiteSpace: "pre-line" }}>{processingLabel}</span>
```

- [ ] **Крок 4: Ручна перевірка — поведінка не змінилась**

Run: `npm run dev`, відкрити `/`.
Expected: кнопка мікрофона виглядає й працює так само, як до рефакторингу (idle/recording/processing стани, `npm run build` зелений).

- [ ] **Крок 5: Commit**

```bash
git add components/capture/MicButton.tsx app/page.tsx app/globals.css
git commit -m "refactor: extract MicButton component with dock/full sizes"
```

---

## Task 4: `Logo` — розміри 32/88px (мінімальна зміна)

`components/brand/Logo.tsx` уже приймає `size` і рендерить лише знак (без назви) — 12.6 ТЗ фактично вже виконано. Ця задача лише формалізує використання розмірів із ТЗ.

**Файли:**
- Modify: `components/brand/Logo.tsx` (без змін розмітки — тільки коментар з фіксацією розмірів)

**Interfaces:** без змін (`size?: number`, `className?: string`).

- [ ] **Крок 1: Оновити коментар над компонентом, зафіксувавши розміри використання**

У `components/brand/Logo.tsx`, доповнити docblock на початку файлу:
```tsx
/**
 * ...(існуючий текст без змін)...
 *
 * Розміри використання (ТЗ «редизайн №2», розділ 4.1–4.2):
 * - `size={88}` — стан `capture` (розгорнутий).
 * - `size={32}` — стан `plan` (лого-знак у куті) і компактний індикатор
 *   обробки з тексту (розділ 5.3).
 */
```

- [ ] **Крок 2: Commit**

```bash
git add components/brand/Logo.tsx
git commit -m "docs: document Logo size usage for two-state screen"
```

---

## Task 5: `CaptureDock` — спільний док (⚠️ Рішення D8)

**Файли:**
- Create: `components/home/CaptureDock.tsx`
- Modify: `app/globals.css` (стилі доку — новий блок, старі `.capture-row`/`.text-input`/`.send-btn` лишаються, бо `CaptureDock` — новий компонент з новими класами `.dock-*`, старі класи стають кандидатами на видалення пізніше, не видаляються зараз)

**Interfaces:**
```typescript
interface CaptureDockProps {
  value: string;
  onChange: (value: string) => void;
  onSubmitText: () => void; // морф на стрілку, відправка тексту
  onMicTap: () => void; // морф на мікрофон, якщо value порожній — розгортає capture; якщо є текст — ігнорується (кнопка вже стрілка)
  placeholder: string; // "Або напиши, що в голові" (capture) чи "Що ще в голові?" (plan)
  disabled?: boolean;
}
```
- Consumes: нічого нового, чистий контрольований інпут.
- Produces: використовується і в `CaptureStage`, і в `PlanStage` (Task 8, 9) як один і той самий компонент — фізична єдність, потрібна для морфа кнопки в Task 10.

- [ ] **Крок 1: Створити компонент**

```tsx
"use client";

import { useState } from "react";

interface CaptureDockProps {
  value: string;
  onChange: (value: string) => void;
  onSubmitText: () => void;
  onMicTap: () => void;
  placeholder: string;
  disabled?: boolean;
}

export default function CaptureDock({
  value,
  onChange,
  onSubmitText,
  onMicTap,
  placeholder,
  disabled,
}: CaptureDockProps) {
  const hasText = value.trim().length > 0;

  return (
    <div className="dock">
      <textarea
        className="dock-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && hasText) {
            e.preventDefault();
            onSubmitText();
          }
        }}
      />
      <button
        type="button"
        className="dock-btn"
        onClick={hasText ? onSubmitText : onMicTap}
        disabled={disabled}
        aria-label={hasText ? "Розібрати текст" : "Почати запис"}
      >
        {hasText ? <SendIcon /> : <DockMicIcon />}
      </button>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

function DockMicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
```

Примітка: морф іконка↔стрілка (кросфейд 140ms, `--dur-tap`) додається в Task 10 разом з рештою Framer Motion-переходів — тут поки миттєва заміна, щоб ізолювати структурний рефакторинг від анімації.

- [ ] **Крок 2: Стилі доку в `app/globals.css`**

Додати новий блок (не займає місце старих класів `.capture-row` тощо):
```css
/* --- CaptureDock (ТЗ 4.3) --- */
.dock {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  background: var(--surface-sunken);
  border: 1px solid var(--border);
  border-radius: var(--r-pill);
  height: 56px;
  padding: 0 var(--s-2) 0 var(--s-4);
}

.dock-field {
  flex: 1;
  min-width: 0;
  min-height: 0;
  max-height: 72px; /* ~3 рядки */
  border: none;
  background: transparent;
  resize: none;
  font-size: 16px;
  font-family: inherit;
  color: var(--ink);
  padding: 8px 0;
}

.dock-field:focus {
  outline: none;
}

.dock-field::placeholder {
  color: var(--ink-3);
}

.dock-btn {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  margin: 0;
  padding: 0;
  border-radius: var(--r-pill);
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: var(--shadow-mic);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dock-btn:hover:not(:disabled) { background: var(--accent-press); }
```

- [ ] **Крок 3: Ручна перевірка ізольовано**

Тимчасово підключити `<CaptureDock value="" onChange={() => {}} onSubmitText={() => {}} onMicTap={() => {}} placeholder="Або напиши, що в голові" />` на сторінці для візуальної перевірки (можна прямо в `app/page.tsx` побіч існуючого блоку, прибрати після перевірки).
Expected: висота 56px, плейсхолдер видно, кнопка 44px кругла праворуч, немає горизонтального скролу на 375px.

- [ ] **Крок 4: Commit**

```bash
git add components/home/CaptureDock.tsx app/globals.css
git commit -m "feat: add CaptureDock component"
```

---

## Task 6: `TaskCard` — по-польове інлайн-редагування (критичний шлях) (⚠️ Рішення D3, D4)

Найризикованіша задача з усього плану — ТЗ прямо називає це критичним шляхом (розділ 1.3). Поточний `TaskCard.tsx` вже має інлайн-редагування, але **всіх полів одразу однією формою** (клік по картці → з'являється `EditFields` з усіма інпутами). ТЗ 6.2 вимагає **редагування конкретного поля, по якому тапнули**, без відкриття форми цілком.

**Файли:**
- Modify: `components/ui/TaskCard.tsx` (велика переробка `EditFields` → окремі inline-редаговані поля)
- Modify: `app/globals.css` (стилі для полів, що редагуються по місцю)

**Interfaces:**
- Consumes: `Task` (з `estimate_minutes` із Task 1), `onUpdate(patch: Partial<Task>)`.
- Produces: без змін пропсів `TaskCardProps` — зовнішній контракт компонента лишається той самий, міняється тільки внутрішня механіка.

- [ ] **Крок 1: Назва — редагування по тапу на сам текст**

Замінити в `TaskCard.tsx` рендер назви (зараз рядки 48-54, `<div className="text-body font-semibold text-ink">{task.title}</div>`) на локальний стан `editingField: "title" | "date" | "priority" | "estimate" | "category" | null`.

```tsx
const [editingField, setEditingField] = useState<
  "title" | "date" | "priority" | "estimate" | "category" | null
>(null);
```

Назва:
```tsx
{editingField === "title" ? (
  <input
    className="task-field-title"
    autoFocus
    defaultValue={task.title}
    onBlur={(e) => {
      onUpdate?.({ title: e.target.value || task.title });
      setEditingField(null);
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") e.currentTarget.blur();
      if (e.key === "Escape") setEditingField(null);
    }}
  />
) : (
  <div
    className={`text-body font-semibold text-ink ${task.done ? "text-ink-3 line-through" : ""}`}
    onClick={() => onUpdate && setEditingField("title")}
    role={onUpdate ? "button" : undefined}
    tabIndex={onUpdate ? 0 : undefined}
  >
    {task.title}
  </div>
)}
```

- [ ] **Крок 2: Пріоритет — циклічне перемикання по тапу (без меню)**

Замінити `PriorityDot` у рядку метаданих на клікабельну версію:
```tsx
<button
  type="button"
  className="priority-dot-btn"
  onClick={() =>
    onUpdate?.({
      priority:
        task.priority === "low" ? "medium" : task.priority === "medium" ? "high" : "low",
    })
  }
  aria-label={`Пріоритет: ${task.priority}. Тап — змінити`}
>
  <PriorityDot priority={task.priority} />
</button>
```

- [ ] **Крок 3: Дата — тап відкриває нативний `<input type="date">` по місцю**

```tsx
{editingField === "date" ? (
  <input
    type="date"
    className="task-field-date"
    autoFocus
    defaultValue={task.due_date ?? ""}
    onBlur={(e) => {
      onUpdate?.({ due_date: e.target.value || null });
      setEditingField(null);
    }}
  />
) : (
  <span onClick={() => onUpdate && setEditingField("date")} role={onUpdate ? "button" : undefined}>
    {task.due_date ? `📅 ${task.due_date}` : onUpdate ? "+ дата" : null}
  </span>
)}
```

Примітка: повноцінний bottom sheet із «сьогодні/завтра/прибрати» (розділ 6.2 ТЗ) — окремий компонент `DatePickerSheet`, виноситься за межі цієї задачі як розширення, якщо після ревʼю виявиться, що нативний `<input type="date">` недостатній на мобільних браузерах з погляду UX. Дефолт зараз — нативний пікер (найдешевше, працює скрізь).

- [ ] **Крок 4: Оцінка часу — числове поле, крок 5 хв**

```tsx
{editingField === "estimate" ? (
  <input
    type="number"
    step={5}
    min={0}
    className="task-field-estimate"
    autoFocus
    defaultValue={task.estimate_minutes ?? ""}
    onBlur={(e) => {
      const val = e.target.value ? Number(e.target.value) : null;
      onUpdate?.({ estimate_minutes: val });
      setEditingField(null);
    }}
  />
) : (
  <span onClick={() => onUpdate && setEditingField("estimate")} role={onUpdate ? "button" : undefined}>
    {task.estimate_minutes ? `≈${task.estimate_minutes} хв` : onUpdate ? "+ час" : null}
  </span>
)}
```

- [ ] **Крок 5: Категорія як єдиний чип (Рішення D3 — не multi-tags)**

```tsx
{editingField === "category" ? (
  <select
    className="task-field-category"
    autoFocus
    defaultValue={task.category}
    onBlur={(e) => {
      onUpdate?.({ category: e.target.value });
      setEditingField(null);
    }}
  >
    {CATEGORIES.map((c) => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>
) : (
  <span
    className="task-chip"
    onClick={() => onUpdate && setEditingField("category")}
    role={onUpdate ? "button" : undefined}
  >
    {task.category}
  </span>
)}
```

- [ ] **Крок 6: Видалити стару функцію `EditFields` цілком**

Прибрати весь блок `function EditFields(...)` наприкінці файлу — його роль тепер розподілена по-польово вище. (Це видалення коду всередині файлу, що редагується, а не видалення файлу — дозволено правилом проєкту.)

- [ ] **Крок 7: Стилі для inline-полів**

Додати в `app/globals.css`:
```css
.task-field-title {
  width: 100%;
  border: none;
  border-bottom: 2px solid var(--signal);
  background: transparent;
  font-size: var(--t-body-size);
  font-weight: 600;
  color: var(--ink);
  padding: 0;
  font-family: inherit;
}
.task-field-title:focus { outline: none; }

.priority-dot-btn {
  margin: 0;
  padding: 4px;
  background: transparent;
  border-radius: 50%;
  min-width: 44px;
  min-height: 44px;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.task-field-date,
.task-field-estimate,
.task-field-category {
  border: 1px solid var(--signal);
  border-radius: var(--r-sm);
  padding: 2px 6px;
  font-size: var(--t-meta-size);
  font-family: var(--font-mono);
  background: var(--surface);
  color: var(--ink);
}

.task-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: var(--accent-soft);
  color: var(--accent);
  cursor: pointer;
}
```

Примітка: `.priority-dot-btn` 44×44 — тач-таргет доступності при візуально 8px крапці всередині (ТЗ розділ 9).

- [ ] **Крок 8: Ручна перевірка кожного поля**

Run: `npm run dev`, створити задачу, перевірити на реальній картці:
Expected: тап по назві → редагований інпут з курсором, `Enter`/blur зберігає; тап по крапці пріоритету — циклічно міняє колір без меню; тап по даті — нативний календар; тап по оцінці часу — число, крок 5; тап по категорії — select. Кожне поле редагується окремо, без відкриття форми цілком.

- [ ] **Крок 9: Commit**

```bash
git add components/ui/TaskCard.tsx app/globals.css
git commit -m "feat: per-field inline editing on TaskCard (replaces full-form edit)"
```

---

## Task 7: `TaskCard` — свайп-видалення і підсвітка нових

**Файли:**
- Modify: `components/ui/TaskCard.tsx` (додати Framer Motion `drag`)
- Modify: `app/globals.css`

**Interfaces:**
- Produces: новий проп `TaskCardProps.isNew?: boolean` — підсвітка `--accent-soft`, згасає за 2000ms із затримкою 800ms (використовується в Task 8/9 після каскаду появи).

- [ ] **Крок 1: Обгорнути картку в `motion.div` з `drag="x"`**

```tsx
import { motion, useAnimationControls } from "framer-motion";

// ... всередині компонента, обгортка замість звичайного <div>:
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={{ left: 0.5, right: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.x < -80 && onDelete) {
      if (window.confirm("Видалити задачу?")) {
        onDelete();
      }
    }
  }}
  className={`flex items-start gap-3 rounded-md border border-border bg-surface p-4 shadow-card ${
    task.done ? "opacity-70" : ""
  } ${isNew ? "task-card-new" : ""}`}
>
  {/* існуючий вміст картки без змін */}
</motion.div>
```

Примітка: свайп праворуч навмисно **нічого не робить** (ТЗ 6.4) — `dragConstraints`/`dragElastic` з `right: 0` не дають картці зсунутись праворуч взагалі, тож окремої обробки не треба.

Примітка 2: `window.confirm` — тимчасове рішення для підтвердження видалення в v1 (нативний браузерний діалог). Кастомна плашка `--danger` з ТЗ 6.4 — косметичне покращення, яке можна зробити окремим маленьким PR після цього плану, якщо `window.confirm` виглядає недостатньо продуктово.

- [ ] **Крок 2: Підсвітка нових задач**

Додати проп і клас:
```tsx
interface TaskCardProps {
  task: Task;
  onToggle?: () => void;
  onUpdate?: (patch: Partial<Task>) => void;
  onDelete?: () => void;
  isNew?: boolean;
}
```

`app/globals.css`:
```css
.task-card-new {
  background: var(--accent-soft);
  animation: task-card-fade-new 1200ms var(--ease) 800ms forwards;
}

@keyframes task-card-fade-new {
  from { background: var(--accent-soft); }
  to { background: var(--surface); }
}

@media (prefers-reduced-motion: reduce) {
  .task-card-new {
    animation: none;
    background: var(--surface);
  }
}
```

- [ ] **Крок 3: Ручна перевірка**

Expected: свайп картки вліво далі ніж ~80px і підтвердження → видалення; свайп управо не рухає картку; нова задача після розбору має теплий фон, що згасає за ~2 секунди.

- [ ] **Крок 4: Commit**

```bash
git add components/ui/TaskCard.tsx app/globals.css
git commit -m "feat: swipe-to-delete and new-task highlight on TaskCard"
```

---

## Task 8: `PlanStage` — шапка, вкладки, групи, порожні стани (⚠️ Рішення D7) — 🛑 ЧЕКПОЙНТ 1

**Файли:**
- Create: `components/home/PlanStage.tsx`
- Create: `components/home/TodayList.tsx`
- Create: `components/home/RecommendationsBlock.tsx`
- Create: `components/ui/Tabs.tsx`
- Modify: `app/globals.css`

**Interfaces:**
```typescript
// Tabs.tsx
interface TabsProps {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}

// TodayList.tsx
interface TodayListProps {
  overdue: Task[];
  today: Task[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  newTaskIds: Set<string>;
}

// RecommendationsBlock.tsx (ТЗ 8.1/8.2)
interface RecommendationsBlockProps {
  tasks: Task[]; // вже відсортовані й обрізані до 3, рахує викликач
  heading: string; // "Можна взятися за це:" або "Якщо є настрій:"
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

// PlanStage.tsx
interface PlanStageProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onMicTap: () => void;
  newTaskIds: Set<string>;
}
```
- Consumes: `selectToday` з Task 2, `TaskCard` з Task 6/7, `CaptureDock` з Task 5, `Logo` (size 32).

- [ ] **Крок 1: `Tabs.tsx`**

```tsx
interface TabsProps {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="pill-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          className={`pill-tab ${active === t.key ? "active" : ""}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

CSS:
```css
.pill-tabs {
  display: flex;
  gap: var(--s-2);
}

.pill-tab {
  margin: 0;
  min-height: 44px;
  padding: 8px 16px;
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--ink-2);
  font-weight: 600;
}
.pill-tab:hover:not(:disabled) { background: var(--surface-sunken); }
.pill-tab.active { background: var(--accent); color: var(--on-accent); }
```

- [ ] **Крок 2: `RecommendationsBlock.tsx` (реалізує ТЗ 8.1/8.2)**

```tsx
import TaskCard from "@/components/ui/TaskCard";
import type { Task } from "@/lib/types";

interface RecommendationsBlockProps {
  tasks: Task[];
  heading: string;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export default function RecommendationsBlock({
  tasks,
  heading,
  onToggle,
  onUpdate,
  onDelete,
}: RecommendationsBlockProps) {
  if (tasks.length === 0) return null;
  return (
    <div className="recommendations">
      <p className="recommendations-heading">{heading}</p>
      <div className="cards">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onToggle={() => onToggle(t.id)}
            onUpdate={(patch) => onUpdate(t.id, patch)}
            onDelete={() => onDelete(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

Функція вибору рекомендацій (сортування `high → найближчий дедлайн → найстаріші`, максимум 3) додається як чиста функція в `lib/plan/selectToday.ts` поруч з `selectToday`:

```typescript
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
```

Тест у `selectToday.test.ts`:
```typescript
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
```

- [ ] **Крок 3: `TodayList.tsx` — групи «Прострочені / На сьогодні»**

```tsx
import TaskCard from "@/components/ui/TaskCard";
import type { Task } from "@/lib/types";

interface TodayListProps {
  overdue: Task[];
  today: Task[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  newTaskIds: Set<string>;
}

export default function TodayList({
  overdue,
  today,
  onToggle,
  onUpdate,
  onDelete,
  newTaskIds,
}: TodayListProps) {
  const groups = [
    { key: "overdue", title: "Прострочені", items: overdue, danger: true },
    { key: "today", title: "На сьогодні", items: today, danger: false },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="task-groups">
      {groups.map((g) => (
        <div key={g.key} className="task-group">
          <h2 className={`group-title-sticky ${g.danger ? "danger" : ""}`}>{g.title}</h2>
          <div className="cards">
            {g.items.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggle={() => onToggle(t.id)}
                onUpdate={(patch) => onUpdate(t.id, patch)}
                onDelete={() => onDelete(t.id)}
                isNew={newTaskIds.has(t.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

CSS для липких заголовків груп:
```css
.group-title-sticky {
  position: sticky;
  top: 0;
  background: var(--bg);
  padding: var(--s-2) 0;
  font-size: var(--t-h2-size);
  font-weight: var(--t-h2-weight);
  color: var(--ink);
  z-index: 1;
}
.group-title-sticky.danger { color: var(--danger); }
```

- [ ] **Крок 4: `PlanStage.tsx` — збирає все разом, реалізує 8.1/8.2/8.3 (⚠️ D7 — тихо, без лічильника)**

```tsx
"use client";

import { useState } from "react";
import Logo from "@/components/brand/Logo";
import Tabs from "@/components/ui/Tabs";
import TodayList from "@/components/home/TodayList";
import RecommendationsBlock from "@/components/home/RecommendationsBlock";
import CaptureDock from "@/components/home/CaptureDock";
import TaskCard from "@/components/ui/TaskCard";
import { selectToday, selectRecommendations } from "@/lib/plan/selectToday";
import type { Task } from "@/lib/types";

interface PlanStageProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onMicTap: () => void;
  newTaskIds: Set<string>;
  dockValue: string;
  onDockChange: (value: string) => void;
  onDockSubmit: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(): string {
  return new Date().toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

export default function PlanStage({
  tasks,
  onToggle,
  onUpdate,
  onDelete,
  onMicTap,
  newTaskIds,
  dockValue,
  onDockChange,
  onDockSubmit,
}: PlanStageProps) {
  const [tab, setTab] = useState<"today" | "all">("today");
  const today = todayISO();
  const { overdue, today: todayTasks } = selectToday(tasks, today);
  const allDone = tasks.length > 0 && tasks.every((t) => t.done);
  const isEmpty = overdue.length === 0 && todayTasks.length === 0;

  const recommendations = isEmpty ? selectRecommendations(tasks) : [];

  return (
    <div className="plan-stage">
      <div className="plan-header">
        <Logo size={32} />
      </div>

      <div className="plan-title-row">
        <h1>Сьогодні</h1>
        <span className="plan-date mono">{formatDateLabel()}</span>
      </div>

      <Tabs
        tabs={[
          { key: "today", label: "Сьогодні" },
          { key: "all", label: "Всі задачі" },
        ]}
        active={tab}
        onChange={(k) => setTab(k as "today" | "all")}
      />

      {tab === "today" ? (
        isEmpty ? (
          <>
            <p className="plan-empty-line">
              {allDone ? "На сьогодні все зроблено" : "На сьогодні нічого термінового."}
            </p>
            <RecommendationsBlock
              tasks={recommendations}
              heading={allDone ? "Якщо є настрій:" : "Можна взятися за це:"}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </>
        ) : (
          <TodayList
            overdue={overdue}
            today={todayTasks}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
            newTaskIds={newTaskIds}
          />
        )
      ) : (
        <div className="cards">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={() => onToggle(t.id)}
              onUpdate={(patch) => onUpdate(t.id, patch)}
              onDelete={() => onDelete(t.id)}
              isNew={newTaskIds.has(t.id)}
            />
          ))}
        </div>
      )}

      <div className="plan-dock-spacer" />
      <div className="plan-dock-sticky">
        <CaptureDock
          value={dockValue}
          onChange={onDockChange}
          onSubmitText={onDockSubmit}
          onMicTap={onMicTap}
          placeholder="Що ще в голові?"
        />
      </div>
    </div>
  );
}
```

CSS:
```css
.plan-stage { display: flex; flex-direction: column; min-height: 100vh; min-height: 100svh; }
.plan-header { padding-top: calc(env(safe-area-inset-top) + var(--s-3)); }
.plan-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: var(--s-4) 0 var(--s-4);
}
.plan-date { color: var(--ink-3); font-size: var(--t-meta-size); }
.plan-empty-line { color: var(--ink-2); text-align: center; margin: var(--s-8) 0 var(--s-4); }
.recommendations-heading { color: var(--ink-2); text-align: center; margin-bottom: var(--s-3); }
.plan-dock-spacer { flex: 1; min-height: var(--s-14); }
.plan-dock-sticky {
  position: sticky;
  bottom: 0;
  padding: var(--s-4) var(--s-5) calc(var(--s-4) + env(safe-area-inset-bottom));
  background: linear-gradient(to top, var(--bg) 70%, transparent);
}
```

Примітка: `newTaskIds` тимчасово прокидається як порожній `Set` до Task 9 (де `HomeScreen` почне його наповнювати після розбору) — компонент вже готовий це приймати.

- [ ] **Крок 5: Ручна перевірка — 🛑 ЧЕКПОЙНТ 1, зупинка на скриншотах**

Підключити `PlanStage` тимчасово напряму в `app/page.tsx` (заміна старого блоку `<section className="lists">`) з реальними даними зі стору, зробити скриншот на розмірі iPhone (375×812) у трьох станах: список із задачами, порожньо-з-рекомендаціями (8.1), все виконано (8.2). **Показати Ользі скриншоти, чекати підтвердження перед Task 9.**

- [ ] **Крок 6: Commit**

```bash
git add components/home/PlanStage.tsx components/home/TodayList.tsx components/home/RecommendationsBlock.tsx components/ui/Tabs.tsx lib/plan/selectToday.ts lib/plan/selectToday.test.ts app/globals.css
git commit -m "feat: PlanStage with tabs, groups, empty-state recommendations"
```

---

## Task 9: `HomeScreen` — кінцевий автомат станів (Рішення D5, D6 підтверджено)

**Файли:**
- Create: `components/home/HomeScreen.tsx`
- Create: `components/home/CaptureStage.tsx`
- Create: `lib/home/useCaptureFlow.ts`
- Modify: `app/page.tsx` (стає тонкою обгорткою: `export default function Home() { return <HomeScreen />; }`)
- `lib/store/tasks.ts` — **не змінюється** (D5: автоочищення на нову сесію лишається)

**Interfaces:**
```typescript
// useCaptureFlow.ts
type FlowState = "capture" | "recording" | "processing" | "plan" | "error";

interface UseCaptureFlowResult {
  state: FlowState;
  elapsedMs: number;
  errorMessage: string;
  dockValue: string;
  setDockValue: (v: string) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  submitText: () => Promise<void>;
  retry: () => void;
  collapseToPlан: () => void; // свайп-униз/тап-поза-кнопкою, лише якщо беклог не порожній
  expandToCapture: () => void; // тап по міні-мікрофону
  newTaskIds: Set<string>;
}
```
- Consumes: `useTasksStore`, `VoiceRecorder` (з `lib/audio/recorder.ts`, без змін), `/api/stt`, `/api/parse`.
- Produces: `HomeScreen` рендерить `CaptureStage` або `PlanStage` (Task 8) залежно від `state`.

- [ ] **Крок 1 (D5 — рішення: лишаємо як є): `useHydrated` не чіпаємо**

Автоочищення задач на нову сесію браузера (`lib/store/tasks.ts`, `useHydrated`) лишається без змін — це свідомий захист від змішування задач різних людей на спільному пристрої, поки нема акаунтів. Наслідок для цієї задачі: `hasBacklog` в `HomeScreen` (крок 4 нижче) завжди рахується від поточного, щойно очищеного стору — стан `capture` за замовчуванням буде показуватись на кожен новий заход браузера, і це коректно, а не баг. Окремого коду в цьому кроці не потрібно, крок лишений у плані як явна нотатка, щоб не повернути це «випадково» пізніше.

- [ ] **Крок 2: `useCaptureFlow.ts` — перенести логіку голосу/тексту з `app/page.tsx`, додати стан-машину**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceRecorder, isRecordingSupported } from "@/lib/audio/recorder";
import { useTasksStore } from "@/lib/store/tasks";

export type FlowState = "capture" | "recording" | "processing" | "plan" | "error";

export function useCaptureFlow(hasBacklog: boolean) {
  const [state, setState] = useState<FlowState>(hasBacklog ? "plan" : "capture");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [dockValue, setDockValue] = useState("");
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set());
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAttemptRef = useRef<{ kind: "audio" | "text"; payload: unknown } | null>(null);

  const addTasks = useTasksStore((s) => s.addTasks);

  useEffect(() => {
    setVoiceSupported(isRecordingSupported());
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.cancel();
    };
  }, []);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    setErrorMessage("");
    try {
      const rec = new VoiceRecorder();
      rec.onError((err) => {
        setErrorMessage(err.message);
        setState("error");
        stopTimer();
      });
      recorderRef.current = rec;
      await rec.start();
      setState("recording");
      const startedAt = Date.now();
      setElapsedMs(0);
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Доступ до мікрофона відхилено. Дозволь мікрофон у налаштуваннях браузера."
          : "Не вдалося почати запис: " + (e instanceof Error ? e.message : String(e));
      setErrorMessage(msg);
      setState("error");
      stopTimer();
    }
  }

  async function transcribeAndParse(blob: Blob, ext: string, durationMs: number) {
    setState("processing");
    try {
      const form = new FormData();
      form.append("audio", blob, `capture.${ext}`);
      form.append("duration_ms", String(durationMs));
      lastAttemptRef.current = { kind: "audio", payload: form };

      const sttRes = await fetch("/api/stt", { method: "POST", body: form });
      const sttData = await sttRes.json();
      if (!sttRes.ok) {
        setErrorMessage(sttData?.error || "Помилка розпізнавання.");
        setState("error");
        return;
      }
      const transcript = (sttData?.transcript || "").trim();
      await parseText(transcript);
    } catch (e) {
      setErrorMessage("Не вдалося обробити запис: " + (e instanceof Error ? e.message : String(e)));
      setState("error");
    }
  }

  async function stopRecording() {
    const rec = recorderRef.current;
    if (!rec) return;
    stopTimer();
    try {
      const result = await rec.stop();
      await transcribeAndParse(result.blob, result.ext, result.durationMs);
    } catch (e) {
      setErrorMessage("Не вдалося обробити запис: " + (e instanceof Error ? e.message : String(e)));
      setState("error");
    }
  }

  async function parseText(text: string) {
    if (!text.trim()) {
      setState("plan"); // ТЗ 8.5 — нуль задач це не помилка
      return;
    }
    setState("processing");
    lastAttemptRef.current = { kind: "text", payload: text };
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data?.error || "Сталася помилка.");
        setState("error");
        return;
      }
      const parsed = data.tasks || [];
      const beforeIds = new Set(useTasksStore.getState().tasks.map((t) => t.id));
      addTasks(parsed);
      const afterIds = useTasksStore.getState().tasks.map((t) => t.id);
      const freshIds = new Set(afterIds.filter((id) => !beforeIds.has(id)));
      setNewTaskIds(freshIds);
      setTimeout(() => setNewTaskIds(new Set()), 2800);
      setDockValue("");
      setState("plan"); // 0 чи більше задач — обидва варіанти складають екран (ТЗ 8.5)
    } catch (e) {
      setErrorMessage("Не вдалося з'єднатися з сервером: " + String(e));
      setState("error");
    }
  }

  async function submitText() {
    await parseText(dockValue);
  }

  function retry() {
    const attempt = lastAttemptRef.current;
    if (!attempt) {
      setState("capture");
      return;
    }
    if (attempt.kind === "text") {
      parseText(attempt.payload as string);
    } else {
      setState("processing");
      // Аудіо вже відправлено раніше — форма одноразова, тому повторний STT
      // вимагав би збереження Blob окремо. Для v1: повтор на текстовому шляху,
      // якщо STT — просимо наговорити ще раз (простіше і чесніше, ніж тримати
      // Blob у пам'яті довше необхідного).
      setState("error");
      setErrorMessage("Спробуй наговорити ще раз.");
    }
  }

  function collapseToPlan() {
    if (hasBacklog) setState("plan");
  }

  function expandToCapture() {
    setState("capture");
  }

  return {
    state,
    elapsedMs,
    errorMessage,
    dockValue,
    setDockValue,
    voiceSupported,
    startRecording,
    stopRecording,
    submitText,
    retry,
    collapseToPlan,
    expandToCapture,
    newTaskIds,
  };
}
```

Примітка щодо «Повторити» для аудіо (ТЗ 8.4 вимагає повтор без повторного запису): чесно фіксую обмеження вище в коді — повний retry аудіо-blob вимагає тримати Blob у стані `useCaptureFlow` між спробами. Якщо ретеншн аудіо для повтору критичний — окрема невелика правка (зберігати `result.blob` в `useRef`, повторно відправляти на `/api/stt`). Позначаю як «зробити, якщо після ревʼю виявиться важливим», не блокує решту плану.

- [ ] **Крок 3: `CaptureStage.tsx`**

```tsx
"use client";

import Brand from "@/components/Brand";
import MicButton from "@/components/capture/MicButton";
import CaptureDock from "@/components/home/CaptureDock";
import type { FlowState } from "@/lib/home/useCaptureFlow";

interface CaptureStageProps {
  state: FlowState;
  elapsedMs: number;
  errorMessage: string;
  showTagline: boolean;
  voiceSupported: boolean;
  dockValue: string;
  onDockChange: (v: string) => void;
  onDockSubmit: () => void;
  onMicClick: () => void;
  onRetry: () => void;
}

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CaptureStage({
  state,
  elapsedMs,
  errorMessage,
  showTagline,
  voiceSupported,
  dockValue,
  onDockChange,
  onDockSubmit,
  onMicClick,
  onRetry,
}: CaptureStageProps) {
  const isProcessing = state === "processing";
  return (
    <div className="capture-screen">
      <div className="hero">
        <Brand tagline={showTagline ? "Плутанина думок в голові? Розкажи — змотаю в план" : undefined} />
        <div className="mic-block">
          <MicButton
            size="full"
            state={isProcessing ? "processing" : state === "recording" ? "recording" : "idle"}
            onClick={onMicClick}
            disabled={!voiceSupported || isProcessing}
            processingLabel={"Розбираю\nпочуте…."}
          />
          <div className="mic-status">
            {state === "recording" && (
              <span className="rec-live">● Запис… {formatTimer(elapsedMs)}</span>
            )}
            {state === "capture" && (
              <span>{voiceSupported ? "Тисни й розказуй" : "Запис голосу недоступний — введи текст нижче"}</span>
            )}
          </div>
          {state === "error" && (
            <div className="error-banner">
              <p>{errorMessage || "Не вдалось розібрати. Спробуй ще раз"}</p>
              <button type="button" className="btn-ghost" onClick={onRetry}>
                Повторити
              </button>
            </div>
          )}
        </div>
      </div>
      <CaptureDock
        value={dockValue}
        onChange={onDockChange}
        onSubmitText={onDockSubmit}
        onMicTap={onMicClick}
        placeholder="Або напиши, що в голові"
        disabled={isProcessing}
      />
    </div>
  );
}
```

CSS для банера помилки:
```css
.error-banner {
  margin-top: var(--s-3);
  padding: var(--s-3) var(--s-4);
  background: color-mix(in srgb, var(--danger) 12%, var(--surface));
  border: 1px solid var(--danger);
  border-radius: var(--r-md);
  text-align: center;
  color: var(--danger);
}
.error-banner .btn-ghost { margin-top: var(--s-2); }
```

- [ ] **Крок 4: `HomeScreen.tsx` — з'єднує все, вирішує стан за замовчуванням (⚠️ D6)**

```tsx
"use client";

import { useMemo } from "react";
import { useTasksStore, useHydrated } from "@/lib/store/tasks";
import { useCaptureFlow } from "@/lib/home/useCaptureFlow";
import CaptureStage from "@/components/home/CaptureStage";
import PlanStage from "@/components/home/PlanStage";

export default function HomeScreen() {
  const hydrated = useHydrated();
  const tasks = useTasksStore((s) => s.tasks);
  const toggleDone = useTasksStore((s) => s.toggleDone);
  const updateTask = useTasksStore((s) => s.updateTask);
  const deleteTask = useTasksStore((s) => s.deleteTask);

  const hasBacklog = tasks.length > 0; // ТЗ 3.1 — сигнал першого заходу

  const flow = useCaptureFlow(hasBacklog);

  const showTagline = useMemo(() => !hasBacklog, [hasBacklog]);

  if (!hydrated) return null; // уникаємо hydration mismatch, як і раніше

  if (flow.state === "plan") {
    return (
      <PlanStage
        tasks={tasks}
        onToggle={toggleDone}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onMicTap={flow.expandToCapture}
        newTaskIds={flow.newTaskIds}
        dockValue={flow.dockValue}
        onDockChange={flow.setDockValue}
        onDockSubmit={flow.submitText}
      />
    );
  }

  return (
    <CaptureStage
      state={flow.state}
      elapsedMs={flow.elapsedMs}
      errorMessage={flow.errorMessage}
      showTagline={showTagline}
      voiceSupported={flow.voiceSupported}
      dockValue={flow.dockValue}
      onDockChange={flow.setDockValue}
      onDockSubmit={flow.submitText}
      onMicClick={flow.state === "recording" ? flow.stopRecording : flow.startRecording}
      onRetry={flow.retry}
    />
  );
}
```

- [ ] **Крок 5: `app/page.tsx` — звести до однієї стрічки**

```tsx
import HomeScreen from "@/components/home/HomeScreen";

export default function Home() {
  return (
    <main className="wrap">
      <HomeScreen />
    </main>
  );
}
```

Видалити з `app/page.tsx` весь попередній код (стан, обробники, JSX) — він переїхав у `HomeScreen`/`useCaptureFlow`/`CaptureStage`/`PlanStage`. Це редагування вмісту файлу, не видалення файлу — дозволено.

- [ ] **Крок 5а: Відхилення дозволу мікрофона (ТЗ 8.6) і скасування записом (8.7)**

У `CaptureStage.tsx` додати клас `.mic-block-denied`, коли `!voiceSupported`, що притишує кнопку (`opacity: 0.5` на `.mic-btn`) — акцент переходить на `CaptureDock`, автофокус на полі **не** ставимо (щоб не відкрити клавіатуру поверх пояснення):
```css
.mic-block-denied .mic-btn { opacity: 0.5; }
```
Скасування записом (свайп убік від кнопки, ТЗ 8.7) — окрема невелика правка `MicButton`: додати `drag="x"` з `dragConstraints={{ left: -60, right: 60 }}`, при `onDragEnd` з `Math.abs(info.offset.x) > 50` і `state === "recording"` викликати `onCancel` (новий проп), що скасовує запис без відправки на STT. Додається в Task 10 разом з рештою drag-жестів (там уже налаштовується Framer Motion на `MicButton`), не тут — щоб не змішувати структурний код стану з жестами.

- [ ] **Крок 6: Ручна перевірка всіх 5 станів вручну**

Run: `npm run build && npm run dev`.
Expected:
1. Порожній `localStorage` → відкрити `/` → стан `capture` з тагляйном.
2. Тап мікрофона → дозволити доступ → стан `recording`, таймер рахує.
3. Стоп запису → стан `processing` → після відповіді `/api/parse` → стан `plan`, задачі видно, підсвічені.
4. З `plan`, тап по мікрофону в доці → повертає в `capture`, тагляйн **не** показується (беклог не порожній).
5. Вимкнути мережу, спробувати розібрати текст → стан `error`, банер, «Повторити» працює.

- [ ] **Крок 7: Commit**

```bash
git add components/home/HomeScreen.tsx components/home/CaptureStage.tsx lib/home/useCaptureFlow.ts app/page.tsx app/globals.css
git commit -m "feat: HomeScreen state machine unifying capture/plan into one screen"
```

---

## Task 10: Framer Motion — морф кнопки, каскад карток — 🛑 ЧЕКПОЙНТ 2

Найризикованіша технічна задача плану (ТЗ 12.5). Робити окремо від Task 9, щоб структурні баги стану не змішувались з анімаційними.

**Файли:**
- Modify: `components/capture/MicButton.tsx` (обгорнути в `motion.button` з `layoutId`)
- Modify: `components/home/HomeScreen.tsx` (обгорнути перемикання `CaptureStage`/`PlanStage` в спільний `LayoutGroup`)
- Modify: `components/home/TodayList.tsx`, `RecommendationsBlock.tsx` (каскад через `motion.div` + `staggerChildren`)
- Modify: `app/globals.css` (додати `--dur-morph`, `--dur-stagger`)

- [ ] **Крок 1: Додати нові токени руху**

`app/globals.css`, у `:root` після `--dur-unwind`:
```css
--dur-morph: 360ms;
--dur-stagger: 40ms;
```

`tailwind.config.ts`, у `transitionDuration`:
```typescript
morph: "360ms",
stagger: "40ms",
```

- [ ] **Крок 1а: Свайп-скасування запису (ТЗ 8.7)**

Додати в `MicButton.tsx` проп `onCancel?: () => void`, активний лише при `state === "recording"`: обгорнути кнопку в `motion.button` з `drag="x"`, `dragConstraints={{ left: -60, right: 60 }}`, `dragElastic={0.3}`, `onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 50) onCancel?.(); }}`. Показати підпис «Відпусти, щоб скасувати» (`--ink-3`) під кнопкою під час перетягування — локальний `useState<boolean>` на `onDrag`. У `useCaptureFlow.ts` додати `cancelRecording()`, що викликає `recorderRef.current?.cancel()` і повертає `state` в `"capture"` без відправки на STT.

- [ ] **Крок 2: `MicButton` — `layoutId` для спільного елемента**

```tsx
import { motion } from "framer-motion";
// ...
<motion.button
  layoutId="mic-button"
  transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
  type="button"
  className={`mic-btn ${state} ${sizeClass}`}
  onClick={onClick}
  disabled={disabled}
  aria-label={state === "recording" ? "Зупинити запис" : "Почати запис"}
>
  {/* без змін всередині */}
</motion.button>
```

Те саме `layoutId="mic-button"` додати і на кнопку в `CaptureDock.tsx` (`.dock-btn` → `motion.button`) — це і є «один і той самий DOM-елемент», що літає між доком і центром композиції (ТЗ 5.1). Framer Motion сам розв'язує це через спільний `layoutId`, якщо обидва елементи в одному `LayoutGroup`/дереві.

- [ ] **Крок 3: Обгорнути `HomeScreen` у `LayoutGroup` і `AnimatePresence`**

```tsx
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
// ...
return (
  <LayoutGroup>
    <AnimatePresence mode="wait">
      {flow.state === "plan" ? (
        <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.36 }}>
          <PlanStage /* ...пропси без змін... */ />
        </motion.div>
      ) : (
        <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.36 }}>
          <CaptureStage /* ...пропси без змін... */ />
        </motion.div>
      )}
    </AnimatePresence>
  </LayoutGroup>
);
```

Примітка: `CaptureDock` рендериться в обох гілках (`CaptureStage` і `PlanStage`) — щоб Framer Motion трактував їхні `mic-button`/`dock-btn` як один логічний елемент через переходи, `CaptureDock` теж має бути одним компонентом усередині спільного `LayoutGroup` (він уже є, з Task 5) — додаткових змін тут не треба, крім `layoutId` з Кроку 2.

- [ ] **Крок 4: Каскад появи карток**

У `TodayList.tsx` і `RecommendationsBlock.tsx` обгорнути список карток:
```tsx
import { motion } from "framer-motion";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }, // --dur-stagger = 40ms
};
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24 } },
};

// ...
<motion.div className="cards" variants={listVariants} initial="hidden" animate="show">
  {items.map((t) => (
    <motion.div key={t.id} variants={cardVariants}>
      <TaskCard task={t} /* ... */ />
    </motion.div>
  ))}
</motion.div>
```

- [ ] **Крок 5: `prefers-reduced-motion` — вимкнути каскад і морф**

Framer Motion підтримує це нативно через `MotionConfig`:
```tsx
import { MotionConfig } from "framer-motion";
// огорнути весь HomeScreen:
<MotionConfig reducedMotion="user">
  <LayoutGroup>{/* ... */}</LayoutGroup>
</MotionConfig>
```
`reducedMotion="user"` автоматично читає `prefers-reduced-motion` з ОС і вимикає `layout`-анімації та переходи, лишаючи миттєві зміни — це закриває вимогу ТЗ 5.5 без ручної розгалуженої логіки.

- [ ] **Крок 6: Ручна перевірка — 🛑 ЧЕКПОЙНТ 2**

Run: `npm run dev`, записати екран (screen recording) переходу `capture → plan` після розбору і `plan → capture` по тапу мікрофона в доці.
Expected: кнопка виглядає одним елементом, що летить/масштабується, а не двома з кросфейдом; картки з'являються по черзі знизу вгору; з увімкненим `prefers-reduced-motion` (у DevTools → Rendering → emulate) всі переходи миттєві, картки з'являються одразу всі. **Показати запис/скриншоти Ользі, чекати підтвердження.**

- [ ] **Крок 7: Commit**

```bash
git add components/capture/MicButton.tsx components/home/HomeScreen.tsx components/home/CaptureDock.tsx components/home/TodayList.tsx components/home/RecommendationsBlock.tsx app/globals.css tailwind.config.ts
git commit -m "feat: Framer Motion shared-element mic button and card cascade"
```

---

## Task 11: Доступність — фокус, aria-live, тач-таргети

**Файли:**
- Modify: `components/home/HomeScreen.tsx` (керування фокусом при зміні стану)
- Modify: `components/capture/MicButton.tsx` / `CaptureStage.tsx` (aria-live регіон)

- [ ] **Крок 1: `aria-live` для статусу**

У `CaptureStage.tsx`, обгорнути `.mic-status` в `aria-live="polite"` (він і зараз текстовий елемент — додати атрибут):
```tsx
<div className="mic-status" aria-live="polite">
```

Додатково транслювати «Готово, додано N задач» після успішного розбору — в `useCaptureFlow.ts`, тримати окремий `announcement: string` стан, виставляти його в `parseText` після `addTasks`:
```typescript
const [announcement, setAnnouncement] = useState("");
// у parseText, після addTasks(parsed):
setAnnouncement(`Готово, додано ${parsed.length} задач`);
```
І рендерити прихований `aria-live` регіон в `HomeScreen.tsx`:
```tsx
<div aria-live="polite" className="sr-only">{flow.announcement}</div>
```
Клас `.sr-only` додати в `app/globals.css`:
```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Крок 2: Перенесення фокуса при зміні стану**

У `HomeScreen.tsx` — `useEffect` на `flow.state`, що переносить фокус на велику кнопку (`capture`) або на заголовок (`plan`):
```tsx
import { useEffect, useRef } from "react";
// ...
const micButtonRef = useRef<HTMLButtonElement>(null);
const headingRef = useRef<HTMLHeadingElement>(null);

useEffect(() => {
  if (flow.state === "capture") micButtonRef.current?.focus();
  if (flow.state === "plan") headingRef.current?.focus();
}, [flow.state]);
```
Прокинути `ref` і `tabIndex={-1}` на кнопку (`MicButton`) і заголовок «Сьогодні» (`PlanStage` → `<h1 ref={...} tabIndex={-1}>Сьогодні</h1>`) — обидва компоненти приймають `ref` через `forwardRef`, якщо ще не приймають.

- [ ] **Крок 3: Перевірка тач-таргетів**

Пройтись DevTools-інспектором по: чекбоксу (`.check`, уже 44px), крапці пріоритету (`.priority-dot-btn`, зроблено в Task 6 — 44px), кнопкам доку (`.dock-btn`, 44px), вкладкам (`.pill-tab`, `min-height: 44px`).
Expected: жоден інтерактивний елемент не менше 44×44px візуальної області кліку.

- [ ] **Крок 4: Ручна перевірка з клавіатури й скрінрідером**

Пройти весь флоу тільки клавіатурою (Tab/Enter/Escape) — фокус видно всюди (вже є `:focus-visible` правило в `globals.css`), фокус переноситься при зміні екрана.

- [ ] **Крок 5: Commit**

```bash
git add components/home/HomeScreen.tsx components/home/CaptureStage.tsx lib/home/useCaptureFlow.ts app/globals.css
git commit -m "a11y: aria-live announcements and focus management on state change"
```

---

## Task 12: Прибрати мертвий код, оновити документацію

**Файли:**
- Modify: `docs/redesign-plan.md` (додати примітку зверху, що документ частково перекритий цим планом)
- Не видаляти нічого без окремого підтвердження — тільки перелічити кандидатів.

- [ ] **Крок 1: Позначити застарілі CSS-класи як кандидатів на видалення**

У `app/globals.css` знайти класи, що більше ніде не використовуються після Task 6/9 (`.task-row`, `.draft-card`, `.field-grid`, `.review-*`, `.capture-row`, `.text-input`, `.send-btn` — частина вже позначена коментарем «застаріле» в поточному файлі). Додати їх у список нижче, не видаляти файл і не видаляти самі класи з CSS.

- [ ] **Крок 2: Додати примітку на початок `docs/redesign-plan.md`**

```markdown
> **Оновлення 23.07.2026:** розділи 3, 4.1–4.2 цього документа перекриті
> планом `docs/superpowers/plans/2026-07-23-home-two-state-screen.md`
> (ТЗ «редизайн №2» — злиття Capture/Review/Today в один екран з двома
> станами). Розділи 1, 2, 8, 9 цього документа лишаються чинними.
```

- [ ] **Крок 3: Список кандидатів на видалення — звести в один список для твого рішення**

Створити (не видаляти файли, лише перелік) у кінці плану-документа розділ «Кандидати на видалення», зі списком: невикористані CSS-класи з Кроку 1, будь-які лишки `useState`/функції в `app/page.tsx`, якщо після Task 9 щось не потрапило в новий код.

- [ ] **Крок 4: Commit**

```bash
git add docs/redesign-plan.md
git commit -m "docs: note redesign-plan.md sections superseded by two-state screen plan"
```

---

## Порядок виконання і чекпойнти

| Задача | Тип | Зупинка на рев'ю? |
|---|---|---|
| 0 | Тулінг | — |
| 1 | Дані (⚠️ D1/D2) | — |
| 2 | Логіка + тести | — |
| 3 | Рефакторинг компонента | — |
| 4 | Документація | — |
| 5 | Новий компонент (⚠️ D8 узгоджено) | — |
| 6 | Критичний шлях (⚠️ D3/D4) | — |
| 7 | Жести | — |
| 8 | Композиція | **🛑 так, скриншоти** |
| 9 | Стейт-машина (⚠️ D5/D6) | — |
| 10 | Анімації (⚠️ D9 узгоджено) | **🛑 так, відео/скриншоти** |
| 11 | Доступність | — |
| 12 | Прибирання/документація | — |

Далі кожної зупинки — не рухатись без твого підтвердження, як і просив документ.
