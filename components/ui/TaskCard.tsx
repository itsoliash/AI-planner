import { useState } from "react";
import { CATEGORIES, PRIORITIES, Priority, Task } from "@/lib/types";
import PriorityDot from "./PriorityDot";

interface TaskCardProps {
  task: Task;
  onToggle?: () => void;
  onUpdate?: (patch: Partial<Task>) => void;
  onDelete?: () => void;
}

/**
 * Єдина картка задачі — використовується у списку на `/`.
 * Тап по вмісту картки відкриває редагування полів прямо на місці —
 * окремого екрана перевірки/підтвердження більше немає (рішення 23.07.2026).
 */
export default function TaskCard({ task, onToggle, onUpdate, onDelete }: TaskCardProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div
      className={`flex items-start gap-3 rounded-md border border-border bg-surface p-4 shadow-card ${
        task.done ? "opacity-70" : ""
      }`}
    >
      {onToggle && (
        <label className="check flex-none">
          <input type="checkbox" checked={task.done} onChange={onToggle} />
          <span className="checkmark" aria-hidden="true" />
        </label>
      )}

      {editing && onUpdate ? (
        <EditFields task={task} onChange={onUpdate} onDone={() => setEditing(false)} />
      ) : (
        <div
          className="min-w-0 flex-1 cursor-pointer"
          role={onUpdate ? "button" : undefined}
          tabIndex={onUpdate ? 0 : undefined}
          onClick={() => onUpdate && setEditing(true)}
          onKeyDown={(e) => {
            if (onUpdate && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setEditing(true);
            }
          }}
        >
          <div
            className={`text-body font-semibold text-ink ${
              task.done ? "text-ink-3 line-through" : ""
            }`}
          >
            {task.title}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-meta text-ink-3">
            <PriorityDot priority={task.priority} />
            <span>{task.category}</span>
            {task.due_date && <span>📅 {task.due_date}</span>}
            {task.time && <span>🕑 {task.time}</span>}
          </div>

          {task.notes && <div className="mt-1 text-meta text-ink-2">{task.notes}</div>}
        </div>
      )}

      {!editing && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Видалити задачу"
          title="Видалити"
          className="m-0 flex-none rounded-md bg-transparent p-2 leading-none text-ink-2 hover:bg-surface-sunken hover:text-danger"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function EditFields({
  task,
  onChange,
  onDone,
}: {
  task: Task;
  onChange: (patch: Partial<Task>) => void;
  onDone: () => void;
}) {
  return (
    <div className="min-w-0 flex-1">
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
            onChange={(e) => onChange({ due_date: e.target.value ? e.target.value : null })}
          />
        </div>
        <div>
          <label className="field-label">Час</label>
          <input
            className="field"
            type="time"
            value={task.time ?? ""}
            onChange={(e) => onChange({ time: e.target.value ? e.target.value : null })}
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

      <button type="button" className="btn-ghost mt-3 w-full" onClick={onDone}>
        Готово
      </button>
    </div>
  );
}
