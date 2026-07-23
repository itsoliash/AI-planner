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

