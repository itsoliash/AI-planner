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

