"use client";

import { useState } from "react";

interface TaskItem {
  title: string;
  due_date: string | null;
  time: string | null;
  priority: "low" | "medium" | "high";
  category: string;
  notes: string | null;
}

const EXAMPLE =
  "Завтра о 10 ранку зідзвон з дизайн-командою. Треба до п'ятниці здати макети лендінга, це терміново. Купити молоко і хліб. Записатись до стоматолога наступного тижня.";

export default function Home() {
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState<TaskItem[] | null>(null);
  const [raw, setRaw] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleParse() {
    setLoading(true);
    setError("");
    setTasks(null);
    setRaw("");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Сталася помилка.");
        if (data?.detail) setRaw(JSON.stringify(data, null, 2));
        return;
      }
      setTasks(data.tasks || []);
      setRaw(JSON.stringify(data, null, 2));
    } catch (e) {
      setError("Не вдалося з'єднатися з сервером: " + String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap">
      <h1>AI Planner — розбір у задачі</h1>
      <p className="sub">
        Встав український текст (наприклад, розшифровку голосу) → отримай
        структуровані задачі. Фаза 0: перевірка якості розбору.
      </p>

      <div className="grid">
        <div>
          <label>Текст українською</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напиши або встав текст із задачами…"
          />
          <div className="hint">
            Немає ідей?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setText(EXAMPLE);
              }}
              style={{ color: "var(--accent)" }}
            >
              Вставити приклад
            </a>
          </div>
          <button onClick={handleParse} disabled={loading || !text.trim()}>
            {loading ? "Розбираю…" : "Розібрати"}
          </button>
          {error && <div className="error">{error}</div>}
        </div>

        <div>
          <label>Результат</label>
          <div className="output">
            {tasks && tasks.length > 0 && (
              <div className="cards">
                {tasks.map((t, i) => (
                  <div className="card" key={i}>
                    <div className="card-title">{t.title}</div>
                    <div className="badges">
                      <span className={`badge ${t.priority}`}>{t.priority}</span>
                      <span className="badge">{t.category}</span>
                      {t.due_date && <span className="badge">📅 {t.due_date}</span>}
                      {t.time && <span className="badge">🕑 {t.time}</span>}
                    </div>
                    {t.notes && <div className="hint">{t.notes}</div>}
                  </div>
                ))}
              </div>
            )}
            {tasks && tasks.length === 0 && (
              <div className="hint">Задач не знайдено.</div>
            )}
            {!tasks && !error && (
              <div className="hint">Тут з'явиться розібраний результат…</div>
            )}
            {raw && (
              <details style={{ marginTop: 16 }}>
                <summary className="hint" style={{ cursor: "pointer" }}>
                  Показати сирий JSON
                </summary>
                <pre>{raw}</pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
