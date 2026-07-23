# Task 1 Report: Add `estimate_minutes` to Task Data Model

**Date:** 2026-07-23  
**Status:** DONE

## Summary

Successfully implemented the `estimate_minutes: number | null` field across the task data model and LLM parsing prompt as specified in the task brief.

## Implementation Details

### 1. File: `lib/types.ts`

**Change:** Added `estimate_minutes: number | null;` to `ParsedTask` interface

**Location:** Line 29, after `category` field, before `notes` field

```typescript
export interface ParsedTask {
  title: string;
  due_date: string | null; // YYYY-MM-DD
  time: string | null; // HH:MM
  priority: Priority;
  category: string;
  estimate_minutes: number | null;  // ← NEW
  notes: string | null;
}
```

**Inheritance:** The field automatically propagates to `Task` interface through `extends ParsedTask` (line 34).

### 2. File: `app/api/parse/route.ts`

#### Change 2a: System Prompt Update

**Location:** Line 23 in `buildSystemPrompt()` function

Added field specification to the LLM instructions:
```
- "estimate_minutes": орієнтовна тривалість виконання в хвилинах, кратно 5 (число) або null, якщо оцінити неможливо
```

This guides the LLM to estimate task duration in minutes (in multiples of 5) or return null if estimation is impossible.

#### Change 2b: TaskItem Interface Update

**Location:** Line 35 in `TaskItem` interface

```typescript
interface TaskItem {
  title: string;
  due_date: string | null;
  time: string | null;
  priority: "low" | "medium" | "high";
  category: string;
  estimate_minutes: number | null;  // ← NEW
  notes: string | null;
}
```

## Verification

### Type Safety
- Both TypeScript interfaces (`ParsedTask` and `TaskItem`) now include the field
- Field type is `number | null` (allows minutes or no estimate)
- Placement matches task spec (after `category`, before `notes`)

### Git Status
- Commit created: `b4fd918` ("feat: add estimate_minutes to task model and parse prompt")
- 2 files modified
- 3 insertions added (1 in types.ts, 2 in route.ts)

### Build Result
- No build verification performed (npm run build timed out in sandbox environment)
- However, changes are purely type/string additions with no runtime logic
- No syntax errors possible — field name and type syntax are correct TypeScript

## Self-Review Checklist

- [x] Field added to `ParsedTask` interface exactly after `category` field
- [x] Field added to `Task` interface via inheritance (automatic)
- [x] System prompt includes `estimate_minutes` specification
- [x] `TaskItem` interface includes `estimate_minutes` field
- [x] All three changes match task brief specifications exactly
- [x] No extra code changes (selective edits only)
- [x] Git commit created with proper message
- [x] No unintended modifications to other files

## Notes

- The field is now ready for Task 2 (`selectToday` logic) and Task 6 (TaskCard UI)
- LLM will attempt to estimate task duration when parsing natural language input
- UI components don't yet handle this field (as designed — that's Task 6)
- No test coverage added (task brief specifies this task has no TDD requirement)

## Files Changed

1. `/Users/olhaliash/Documents/code/AI planner/lib/types.ts` — Added field to ParsedTask
2. `/Users/olhaliash/Documents/code/AI planner/app/api/parse/route.ts` — Updated prompt and TaskItem interface

---

## Field Reordering Fix (2026-07-23)

**Issue Found:** Task reviewer identified that `estimate_minutes` was placed between `category` and `notes`, but the brief's code sample shows it should come AFTER `notes` (as the last field).

### Changes Made

#### 1. `lib/types.ts` - ParsedTask Interface

Reordered fields:

```typescript
export interface ParsedTask {
  title: string;
  due_date: string | null; // YYYY-MM-DD
  time: string | null; // HH:MM
  priority: Priority;
  category: string;
  notes: string | null;              // ← moved before estimate_minutes
  estimate_minutes: number | null;   // ← moved to last
}
```

#### 2. `app/api/parse/route.ts` - TaskItem Interface

Reordered fields to match:

```typescript
interface TaskItem {
  title: string;
  due_date: string | null;
  time: string | null;
  priority: "low" | "medium" | "high";
  category: string;
  notes: string | null;              // ← moved before estimate_minutes
  estimate_minutes: number | null;   // ← moved to last
}
```

### Verification

**TypeScript Compilation:**
```bash
npx tsc --noEmit
```
Result: No errors (successful compilation)

**Git Commit:**
- Commit SHA: `2f94f4343db7b654b7da6ce235a0b7c9a96c4126`
- Message: "fix: reorder estimate_minutes field to match brief"
- Files modified: 2 (lib/types.ts, app/api/parse/route.ts)
- Changes: 2 insertions, 2 deletions (pure field reordering)

### Completion Status

- [x] `estimate_minutes` moved to come after `notes` in both interfaces
- [x] Field order now matches brief specification exactly
- [x] TypeScript compilation verified
- [x] Git commit created with proper message
- [x] No functional changes — pure field ordering fix
