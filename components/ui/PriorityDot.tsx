import type { Priority } from "@/lib/types";

/**
 * Крапка пріоритету (ТЗ 2.1). Терміновість — синім (`signal`), не червоним:
 * червоний зарезервований лише для видалення/прострочення (`danger`).
 */
const DOT_CLASS: Record<Priority, string> = {
  high: "bg-signal",
  medium: "bg-accent",
  low: "bg-ink-disabled",
};

export default function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-pill ${DOT_CLASS[priority]}`}
      aria-hidden="true"
    />
  );
}
