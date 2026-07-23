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

