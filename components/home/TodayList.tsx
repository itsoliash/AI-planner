import TaskCard from "@/components/ui/TaskCard";
import type { Task } from "@/lib/types";

interface TodayListProps {
  overdue: Task[];
  today: Task[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

/**
 * Групи «Прострочені → На сьогодні» (ТЗ 4.2). Порожні групи не рендеряться,
 * заголовки груп липкі при скролі.
 */
export default function TodayList({
  overdue,
  today,
  onToggle,
  onUpdate,
  onDelete,
}: TodayListProps) {
  const groups = [
    { key: "overdue", title: "Прострочені", items: overdue, danger: true },
    { key: "today", title: null, items: today, danger: false },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="task-groups">
      {groups.map((g) => (
        <div key={g.key} className="task-group">
          {g.title && (
            <h2 className={`group-title-sticky ${g.danger ? "danger" : ""}`}>{g.title}</h2>
          )}
          <div className="cards">
            {g.items.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggle={() => onToggle(t.id)}
                onUpdate={(patch) => onUpdate(t.id, patch)}
                onDelete={() => onDelete(t.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
