# AI Planner — Фаза 0

Прототип: український текст → структуровані задачі (JSON) через OpenRouter (Llama 3.3 70B).

## Локальний запуск

```bash
npm install
cp .env.local.example .env.local   # і встав свій ключ OpenRouter
npm run dev
```

Відкрий http://localhost:3000

## Змінні середовища

| Змінна | Опис |
|--------|------|
| `OPENROUTER_API_KEY` | Ключ з openrouter.ai/keys (обовʼязково) |
| `OPENROUTER_MODEL` | Модель (за замовчуванням `meta-llama/llama-3.3-70b-instruct`) |

Ключ читається лише на сервері (в `/api/parse`) і ніколи не потрапляє у браузер.

## Деплой на Vercel

1. Запуш репозиторій у GitHub.
2. На vercel.com → New Project → імпортуй репозиторій.
3. У Settings → Environment Variables додай `OPENROUTER_API_KEY`.
4. Deploy → отримаєш живий URL.

## Структура

- `app/page.tsx` — сторінка з полем вводу та відображенням задач
- `app/api/parse/route.ts` — серверний роут, що звертається до OpenRouter
- `app/globals.css` — стилі
