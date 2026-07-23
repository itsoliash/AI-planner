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

