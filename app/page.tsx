"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VoiceRecorder, isRecordingSupported } from "@/lib/audio/recorder";
import { Task } from "@/lib/types";
import { useTasksStore, useHydrated } from "@/lib/store/tasks";

type VoiceState = "idle" | "recording" | "transcribing";
type TabKey = "today" | "all";

const EXAMPLE =
  "Завтра о 10 ранку зідзвон з дизайн-командою. Треба до п'ятниці здати макети лендінга, це терміново. Купити молоко і хліб. Записатись до стоматолога наступного тижня.";

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Стор
  const hydrated = useHydrated();
  const tasks = useTasksStore((s) => s.tasks);
  const setDrafts = useTasksStore((s) => s.setDrafts);
  const toggleDone = useTasksStore((s) => s.toggleDone);
  const deleteTask = useTasksStore((s) => s.deleteTask);

  const [tab, setTab] = useState<TabKey>("today");

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
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Сталася помилка.");
        return;
      }
      const parsed = data.tasks || [];
      if (parsed.length === 0) {
        setError("Задач не знайдено. Спробуй сформулювати конкретніше.");
        return;
      }
      setDrafts(parsed);
      router.push("/review");
    } catch (e) {
      setError("Не вдалося з'єднатися з сервером: " + String(e));
    } finally {
      setLoading(false);
    }
  }

  const isBusy = voiceState !== "idle";

  const today = todayISO();
  const visibleTasks = useMemo(() => {
    if (tab === "all") return tasks;
    // «Сьогодні»: сьогоднішні + прострочені, ще не виконані.
    return tasks.filter(
      (t) => !t.done && t.due_date !== null && t.due_date <= today
    );
  }, [tasks, tab, today]);

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <main className="wrap">
      <h1>AI Planner — розбір голосу в задачі</h1>
      <p className="sub">
        Наговори або встав текст → отримай структуровані задачі. Фаза 0:
        голос → транскрипт → розбір → підтвердження.
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

      {/* Захоплення тексту */}
      <div className="capture">
        <label>Текст (голос або вручну)</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Наговори кнопкою вгорі або напиши текст із задачами…"
          disabled={isBusy}
        />
        <div className="capture-actions">
          <button onClick={handleParse} disabled={loading || isBusy || !text.trim()}>
            {loading ? "Розбираю…" : "Розібрати"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setText("");
              setError("");
            }}
            disabled={isBusy || !text.trim()}
          >
            Очистити
          </button>
          {!text.trim() && (
            <a
              href="#"
              className="hint-link"
              onClick={(e) => {
                e.preventDefault();
                setText(EXAMPLE);
              }}
            >
              Вставити приклад
            </a>
          )}
        </div>
        {error && <div className="error">{error}</div>}
      </div>

      {/* Списки */}
      <section className="lists">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === "today" ? "active" : ""}`}
            onClick={() => setTab("today")}
          >
            Сьогодні
          </button>
          <button
            type="button"
            className={`tab ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
          >
            Всі задачі {hydrated && tasks.length > 0 ? `(${tasks.length})` : ""}
          </button>
        </div>

        {!hydrated ? (
          <div className="hint">Завантаження…</div>
        ) : visibleTasks.length === 0 ? (
          <div className="hint">
            {tab === "today"
              ? "На сьогодні порожньо. Наговори або встав задачі вгорі."
              : "Задач ще немає. Наговори або встав текст і натисни «Розібрати»."}
          </div>
        ) : (
          <div className="cards">
            {visibleTasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                onToggle={() => toggleDone(t.id)}
                onDelete={() => deleteTask(t.id)}
              />
            ))}
          </div>
        )}

        {hydrated && tab === "all" && doneCount > 0 && (
          <div className="hint">Виконано: {doneCount} із {tasks.length}</div>
        )}
      </section>
    </main>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`card task-row ${task.done ? "done" : ""}`}>
      <label className="check">
        <input type="checkbox" checked={task.done} onChange={onToggle} />
        <span className="checkmark" aria-hidden="true" />
      </label>
      <div className="task-body">
        <div className="card-title">{task.title}</div>
        <div className="badges">
          <span className={`badge ${task.priority}`}>{task.priority}</span>
          <span className="badge">{task.category}</span>
          {task.due_date && <span className="badge">📅 {task.due_date}</span>}
          {task.time && <span className="badge">🕑 {task.time}</span>}
        </div>
        {task.notes && <div className="hint">{task.notes}</div>}
      </div>
      <button
        type="button"
        className="icon-btn"
        onClick={onDelete}
        aria-label="Видалити задачу"
        title="Видалити"
      >
        ✕
      </button>
    </div>
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
