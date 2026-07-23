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

