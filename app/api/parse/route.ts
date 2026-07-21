import { NextRequest, NextResponse } from "next/server";

// Роут працює на сервері — ключ OpenRouter НІКОЛИ не потрапляє в браузер.
export const runtime = "nodejs";

const MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct";

function buildSystemPrompt(today: string): string {
  return `Ти — асистент-планувальник. Отримуєш довільний текст українською (часто це розшифровка усного мовлення) і перетворюєш його на список задач у форматі JSON.

Сьогоднішня дата: ${today}. Використовуй її, щоб розв'язувати відносні дати ("завтра", "у п'ятницю", "наступного тижня", "через 2 дні").

Правила:
- Виділяй КОЖНУ окрему задачу як окремий об'єкт.
- Відповідай ВИКЛЮЧНО валідним JSON без пояснень, без markdown, без \`\`\`.
- Структура відповіді: {"tasks": [ ... ]}.
- Кожна задача має поля:
  - "title": короткий формулювання задачі українською (рядок)
  - "due_date": дата у форматі YYYY-MM-DD або null, якщо не вказано
  - "time": час у форматі HH:MM (24 год) або null
  - "priority": одне з "low", "medium", "high" (якщо не ясно — "medium")
  - "category": одне з "робота", "побут", "здоров'я", "фінанси", "навчання", "інше"
  - "notes": додаткові деталі рядком або null
- Не вигадуй задач, яких немає в тексті. Якщо задач немає — поверни {"tasks": []}.
- Зберігай наміри користувача, не перефразовуй сильно.`;
}

interface TaskItem {
  title: string;
  due_date: string | null;
  time: string | null;
  priority: "low" | "medium" | "high";
  category: string;
  notes: string | null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Не налаштовано OPENROUTER_API_KEY. Додай ключ у .env.local (локально) або в Environment Variables на Vercel." },
      { status: 500 }
    );
  }

  let text: string;
  try {
    const body = await req.json();
    text = (body?.text ?? "").toString().trim();
  } catch {
    return NextResponse.json({ error: "Некоректне тіло запиту." }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Порожній текст." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(today) },
          { role: "user", content: text },
        ],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return NextResponse.json(
        { error: `OpenRouter повернув помилку ${resp.status}`, detail },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    let parsed: { tasks: TaskItem[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      // Підстраховка: якщо модель обгорнула JSON у текст — витягуємо перший { ... }
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "Модель повернула не-JSON відповідь.", raw: content },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
    return NextResponse.json({ tasks, model: MODEL, today });
  } catch (err) {
    return NextResponse.json(
      { error: "Не вдалося звернутися до OpenRouter.", detail: String(err) },
      { status: 502 }
    );
  }
}
