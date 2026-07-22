"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, PRIORITIES, Priority, Task } from "@/lib/types";
import { useTasksStore, useHydrated } from "@/lib/store/tasks";
import Brand from "@/components/Brand";

export default function ReviewPage() {
  const router = useRouter();
  const hydrated = useHydrated();

  const drafts = useTasksStore((s) => s.drafts);
  const updateDraft = useTasksStore((s) => s.updateDraft);
  const removeDraft = useTasksStore((s) => s.removeDraft);
  const clearDrafts = useTasksStore((s) => s.clearDrafts);
  const confirmDrafts = useTasksStore((s) => s.confirmDrafts);

  // Зайшли напряму / оновили сторінку — чернеток нема, повертаємось.
  useEffect(() => {
    if (hydrated && drafts.length === 0) {
      router.replace("/");
    }
  }, [hydrated, drafts.length, router]);

  function handleConfirm() {
    confirmDrafts();
    router.push("/");
  }

  function handleCancel() {
    clearDrafts();
    router.push("/");
  }

  if (!hydrated || drafts.length === 0) {
    return (
      <main className="wrap">
        <div className="hint">Завантаження…</div>
      </main>
    );
  }

  return (
    <main className="wrap">
      <Brand />
      <h1>Перевір задачі</h1>
      <p className="sub">
        Виправ, що треба, або прибери зайве. Коли все ок — натисни «Підтвердити»,
        і задачі потраплять у твій список.
      </p>

      <div className="cards">
        {drafts.map((d, i) => (
          <DraftCard
            key={d.id}
            index={i + 1}
            task={d}
            onChange={(patch) => updateDraft(d.id, patch)}
            onRemove={() => removeDraft(d.id)}
          />
        ))}
      </div>

      <div className="review-actions">
        <button onClick={handleConfirm}>
          Підтвердити ({drafts.length})
        </button>
        <button type="button" className="btn-ghost" onClick={handleCancel}>
          Скасувати
        </button>
      </div>
    </main>
  );
}

function DraftCard({
  index,
  task,
  onChange,
  onRemove,
}: {
  index: number;
  task: Task;
  onChange: (patch: Partial<Task>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="card draft-card">
      <div className="draft-head">
        <span className="draft-num">#{index}</span>
        <button
          type="button"
          className="icon-btn"
          onClick={onRemove}
          aria-label="Прибрати задачу"
          title="Прибрати"
        >
          ✕
        </button>
      </div>

      <label className="field-label">Назва</label>
      <input
        className="field"
        type="text"
        value={task.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Що зробити"
      />

      <div className="field-grid">
        <div>
          <label className="field-label">Дата</label>
          <input
            className="field"
            type="date"
            value={task.due_date ?? ""}
            onChange={(e) =>
              onChange({ due_date: e.target.value ? e.target.value : null })
            }
          />
        </div>
        <div>
          <label className="field-label">Час</label>
          <input
            className="field"
            type="time"
            value={task.time ?? ""}
            onChange={(e) =>
              onChange({ time: e.target.value ? e.target.value : null })
            }
          />
        </div>
        <div>
          <label className="field-label">Пріоритет</label>
          <select
            className="field"
            value={task.priority}
            onChange={(e) => onChange({ priority: e.target.value as Priority })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Категорія</label>
          <select
            className="field"
            value={CATEGORIES.includes(task.category as never) ? task.category : "інше"}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="field-label">Нотатки</label>
      <textarea
        className="field field-notes"
        value={task.notes ?? ""}
        onChange={(e) => onChange({ notes: e.target.value ? e.target.value : null })}
        placeholder="Додаткові деталі (необовʼязково)"
      />
    </div>
  );
}
