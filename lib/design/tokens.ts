/**
 * Типізований доступ до дизайн-токенів для випадків, де потрібен JS,
 * а не CSS (наприклад, мапа пріоритету -> колір у PriorityDot).
 *
 * Єдине джерело правди для самих значень — CSS-змінні в `app/globals.css` :root.
 * Значення тут мають лишатися синхронізованими з ними вручну (токенів мало,
 * дублювання дешевше за генерацію з CSS у прототипі).
 */

export const colors = {
  bg: "#FFF7F0",
  surface: "#FFFFFF",
  surfaceSunken: "#F7EBE1",
  border: "#EADFD6",
  ink: "#3C3C3B",
  ink2: "#6B6764",
  ink3: "#756E69",
  inkDisabled: "#9A948F",
  accent: "#7A6A6A",
  accentPress: "#665858",
  accentSoft: "#EFE6E2",
  signal: "#0E0BAE",
  signalSoft: "#E7E6FA",
  danger: "#9E4A3C",
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  14: "56px",
  18: "72px",
} as const;

export const radius = {
  sm: "10px",
  md: "14px",
  lg: "20px",
  pill: "999px",
} as const;

export const shadow = {
  card: "0 1px 2px rgba(60,60,59,.05)",
  mic: "0 10px 32px rgba(122,106,106,.22)",
} as const;

export const motion = {
  ease: "cubic-bezier(.32,.72,0,1)",
  durTap: "140ms",
  durState: "240ms",
  durUnwind: "700ms",
} as const;

export type Priority = "low" | "medium" | "high";

/**
 * Мапа пріоритетів (ТЗ 2.1). Терміновість — синій `signal`, ніколи не червоний:
 * червоний (`danger`) зарезервований лише для видалення й прострочення.
 */
export const priorityColor: Record<Priority, string> = {
  high: colors.signal,
  medium: colors.accent,
  low: colors.inkDisabled,
};
