import { useState } from "react";
import { CATEGORIES, Task } from "@/lib/types";
import PriorityDot from "./PriorityDot";

interface TaskCardProps {
  task: Task;
  onToggle?: () => void;
  onUpdate?: (patch: Partial<Task>) => void;
  onDelete?: () => void;
}

/**
 * Єдина картка задачі — використовується у списку на `/`.
 * Кожне поле редагується незалежно по тапу на нього самого —
 * форми "редагувати всю картку" більше немає (рішення 23.07.2026, Task 6).
 */
export default function TaskCard({ task, onToggle, onUpdate, onDelete }: TaskCardProps) {
  const [editingField, setEditingField] = useState<
    "title" | "date" | "priority" | "estimate" | "category" | null
  >(null);

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

      <div className="min-w-0 flex-1">
        {editingField === "title" ? (
          <input
            className="task-field-title"
            autoFocus
            defaultValue={task.title}
            onBlur={(e) => {
              onUpdate?.({ title: e.target.value || task.title });
              setEditingField(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditingField(null);
            }}
          />
        ) : (
          <div
            className={`text-body font-semibold text-ink ${
              task.done ? "text-ink-3 line-through" : ""
            }`}
            onClick={() => onUpdate && setEditingField("title")}
            role={onUpdate ? "button" : undefined}
            tabIndex={onUpdate ? 0 : undefined}
          >
            {task.title}
          </div>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-meta text-ink-3">
          <button
            type="button"
            className="priority-dot-btn"
            onClick={() =>
              onUpdate?.({
                priority:
                  task.priority === "low"
                    ? "medium"
                    : task.priority === "medium"
                      ? "high"
                      : "low",
              })
            }
            aria-label={`Пріоритет: ${task.priority}. Тап — змінити`}
          >
            <PriorityDot priority={task.priority} />
          </button>

          {editingField === "category" ? (
            <select
              className="task-field-category"
              autoFocus
              defaultValue={task.category}
              onBlur={(e) => {
                onUpdate?.({ category: e.target.value });
                setEditingField(null);
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <span
              className="task-chip"
              onClick={() => onUpdate && setEditingField("category")}
              role={onUpdate ? "button" : undefined}
            >
              {task.category}
            </span>
          )}

          {editingField === "date" ? (
            <input
              type="date"
              className="task-field-date"
              autoFocus
              defaultValue={task.due_date ?? ""}
              onBlur={(e) => {
                onUpdate?.({ due_date: e.target.value || null });
                setEditingField(null);
              }}
            />
          ) : (
            <span
              onClick={() => onUpdate && setEditingField("date")}
              role={onUpdate ? "button" : undefined}
            >
              {task.due_date ? `📅 ${task.due_date}` : onUpdate ? "+ дата" : null}
            </span>
          )}

          {editingField === "estimate" ? (
            <input
              type="number"
              step={5}
              min={0}
              className="task-field-estimate"
              autoFocus
              defaultValue={task.estimate_minutes ?? ""}
              onBlur={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                onUpdate?.({ estimate_minutes: val });
                setEditingField(null);
              }}
            />
          ) : (
            <span
              onClick={() => onUpdate && setEditingField("estimate")}
              role={onUpdate ? "button" : undefined}
            >
              {task.estimate_minutes ? `≈${task.estimate_minutes} хв` : onUpdate ? "+ час" : null}
            </span>
          )}

          {task.time && <span>🕑 {task.time}</span>}
        </div>

        {task.notes && <div className="mt-1 text-meta text-ink-2">{task.notes}</div>}
      </div>

      {onDelete && (
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
