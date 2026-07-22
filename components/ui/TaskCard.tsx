import type { Task } from "@/lib/types";
import PriorityDot from "./PriorityDot";

interface TaskCardProps {
  task: Task;
  onToggle?: () => void;
  onDelete?: () => void;
}

/**
 * Єдина картка задачі — використовується і в списку на `/`, і на `/review`
 * (замість колишніх окремих `.task-row` / `.draft-card`).
 */
export default function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-md border border-border bg-surface p-4 shadow-card ${
        task.done ? "opacity-70" : ""
      }`}
    >
      {onToggle && (
        <label className="check mt-0.5 flex-none">
          <input type="checkbox" checked={task.done} onChange={onToggle} />
          <span className="checkmark" aria-hidden="true" />
        </label>
      )}

      <div className="min-w-0 flex-1">
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

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Видалити задачу"
          title="Видалити"
          className="flex-none rounded-md px-2 py-1 text-ink-2 hover:bg-surface-sunken hover:text-danger"
        >
          ✕
        </button>
      )}
    </div>
  );
}
