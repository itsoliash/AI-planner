"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceRecorder, isRecordingSupported } from "@/lib/audio/recorder";

interface TaskItem {
  title: string;
  due_date: string | null;
  time: string | null;
  priority: "low" | "medium" | "high";
  category: string;
  notes: string | null;
}

type VoiceState = "idle" | "recording" | "transcribing";

const EXAMPLE =
  "Завтра о 10 ранку зідзвон з дизайн-командою. Треба до п'ятниці здати макети лендінга, це терміново. Купити молоко і хліб. Записатись до стоматолога наступного тижня.";

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Home() {
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState<TaskItem[] | null>(null);
  const [raw, setRaw] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Голос
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setError("");
    try {
      const rec = new VoiceRecorder();
      rec.onError((err) => {
        setError(err.message);
        setVoiceState("idle");
        stopTimer();
      });
      recorderRef.current = rec;
      // getUserMedia викликається за тапом — вимога iOS
      await rec.start();
      setVoiceState("recording");
      const startedAt = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(Date.now() - startedAt), 250);
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Доступ до мікрофона відхилено. Дозволь мікрофон у налаштуваннях браузера."
          : "Не вдалося почати запис: " + (e instanceof Error ? e.message : String(e));
      setError(msg);
      setVoiceState("idle");
      stopTimer();
    }
  }

  async function stopRecording() {
    const rec = recorderRef.current;
    if (!rec) return;
    stopTimer();
    setVoiceState("transcribing");
    try {
      const result = await rec.stop();
      const form = new FormData();
      form.append("audio", result.blob, `capture.${result.ext}`);
      form.append("duration_ms", String(result.durationMs));

      const res = await fetch("/api/stt", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Помилка розпізнавання.");
        setVoiceState("idle");
        return;
      }
      const transcript = (data?.transcript || "").trim();
      // Додаємо до наявного тексту, не затираємо введене вручну
      setText((prev) => (prev.trim() ? prev.trim() + "\n" + transcript : transcript));
      setVoiceState("idle");
    } catch (e) {
      setError("Не вдалося обробити запис: " + (e instanceof Error ? e.message : String(e)));
      setVoiceState("idle");
    }
  }

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

  const isBusy = voiceState !== "idle";

  return (
    <main className="wrap">
      <h1>AI Planner — розбір голосу в задачі</h1>
      <p className="sub">
        Наговори або встав текст → отримай структуровані задачі. Фаза 0:
        голос → транскрипт → розбір.
      </p>

      {/* Голос — головний акцент */}
      <div className="mic-block">
        <button
          type="button"
          className={`mic-btn ${voiceState}`}
          onClick={voiceState === "recording" ? stopRecording : startRecording}
          disabled={!voiceSupported || voiceState === "transcribing"}
          aria-label={voiceState === "recording" ? "Зупинити запис" : "Почати запис"}
        >
          {voiceState === "transcribing" ? (
            <span className="mic-spinner" />
          ) : (
            <MicIcon active={voiceState === "recording"} />
          )}
        </button>
        <div className="mic-status">
          {voiceState === "idle" && (voiceSupported
            ? "Натисни, щоб наговорити задачі"
            : "Запис голосу недоступний у цьому браузері — введи текст нижче")}
          {voiceState === "recording" && (
            <span className="rec-live">● Запис… {formatTimer(elapsed)}</span>
          )}
          {voiceState === "transcribing" && "Розпізнаю мовлення…"}
        </div>
      </div>

      <div className="grid">
        <div>
          <label>Текст (голос або вручну)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Наговори кнопкою вгорі або напиши текст із задачами…"
            disabled={isBusy}
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
          <button onClick={handleParse} disabled={loading || isBusy || !text.trim()}>
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
