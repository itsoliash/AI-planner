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

