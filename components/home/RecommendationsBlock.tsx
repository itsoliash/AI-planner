import TaskCard from "@/components/ui/TaskCard";
import type { Task } from "@/lib/types";

interface RecommendationsBlockProps {
  tasks: Task[];
  heading: string;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

/**
 * Блок «можна взятися за це» / «якщо є настрій» (ТЗ 8.1/8.2). Картки тут —
 * звичайні TaskCard, повністю функціональні, це не прев'ю.
 */
export default function RecommendationsBlock({
  tasks,
  heading,
  onToggle,
  onUpdate,
  onDelete,
}: RecommendationsBlockProps) {
  if (tasks.length === 0) return null;
  return (
    <div className="recommendations">
      <p className="recommendations-heading">{heading}</p>
      <div className="cards">
        {tasks.map((t) => (
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
  );
}
