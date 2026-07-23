# Task 5 Report: CaptureDock Component

## Status: DONE

## Summary
Successfully created the `CaptureDock` component and added corresponding CSS rules to `app/globals.css`. The component is now ready for integration in Tasks 8-9.

## Files Created/Modified

### 1. Created: `components/home/CaptureDock.tsx`
- **Lines:** 72
- **Key features:**
  - Controlled textarea with `value` and `onChange` props
  - Icon-swapping button logic: displays `DockMicIcon` when empty, `SendIcon` when text is present
  - Enter-to-submit: triggers `onSubmitText()` only when Enter is pressed WITHOUT Shift AND text is not empty
  - If Shift+Enter is pressed, textarea gets a newline (default browser behavior preserved)
  - If text is empty, Enter does nothing
  - Button click behavior: `hasText ? onSubmitText : onMicTap` — routes to correct handler based on state
  - Disabled state respected on both textarea and button
  - Proper aria-labels for accessibility (Ukrainian labels as per spec)
  - SVG icons defined inline (SendIcon and DockMicIcon)

### 2. Modified: `app/globals.css`
- **Lines added:** 51 (lines 560-610)
- **CSS classes added:**
  - `.dock`: Flex container, 56px height, pill-shaped, uses design tokens
  - `.dock-field`: Textarea styling with transparent bg, max-height 72px (~3 lines), proper focus behavior
  - `.dock-btn`: 44px circular button with accent styling, hover state, shadow

**Design system compliance:**
- Uses CSS custom properties: `--s-2`, `--s-4`, `--surface-sunken`, `--border`, `--r-pill`, `--accent`, `--accent-press`, `--on-accent`, `--shadow-mic`
- Consistent with existing component styling patterns
- No hardcoded colors or spacing values

## Verification

### TypeScript Compilation
```bash
npx tsc --noEmit
```
**Result:** ✓ No errors (exit code 0)

### Component Logic Review
1. **Button icon swap:** `hasText ? <SendIcon /> : <DockMicIcon />` correctly displays icon based on `value.trim().length > 0`
2. **Enter-to-submit:** `if (e.key === "Enter" && !e.shiftKey && hasText)` ensures:
   - Enter key only submits if text exists
   - Shift+Enter produces newline (not blocked)
   - Other text input works normally
3. **Disabled state:** Propagated to both textarea and button
4. **Button routing:** `onClick={hasText ? onSubmitText : onMicTap}` ensures correct behavior based on state

### CSS Design Verification
- Container height: 56px (matches dock container spec)
- Textarea max-height: 72px (~3 lines per brief requirement)
- Button size: 44×44px (touch target accessibility)
- Pill border-radius: `var(--r-pill)` (999px, consistent with design system)
- Color tokens: All use CSS variables from `:root` definitions
- No temporary mounts in `app/page.tsx` (per instructions — visual verification deferred to Task 9)

## Git Commit

```
Commit: 4d32d00
Subject: feat: add CaptureDock component
Files changed: 2
  - components/home/CaptureDock.tsx (new)
  - app/globals.css (modified: +51 lines)
```

## Notes for Next Tasks

- Component is ready for `CaptureStage` (Task 8) and `PlanStage` (Task 9)
- Icon morphing animation (crossfade 140ms per `--dur-tap`) will be added in Task 10 via Framer Motion
- Visual verification will occur in Task 9 when component is integrated into `app/page.tsx`
- Old `.capture-row`, `.text-input`, `.send-btn` CSS classes remain untouched (kept for backward compatibility, candidates for deletion in later task when fully migrated to dock component)

## Acceptance Criteria Met

- [x] Component created at `components/home/CaptureDock.tsx` with exact spec code
- [x] CSS rules added to `app/globals.css` with design system tokens
- [x] TypeScript compilation succeeds
- [x] Component logic verified (button icon swap, Enter-to-submit, disabled state)
- [x] No temporary mounts in app/page.tsx
- [x] Git commit completed
- [x] Report generated

---

# Task 5 Fix: Code Review Fixes

## Findings Applied

### Finding 1 (Important): Textarea Auto-Grow Behavior
**Issue:** The textarea had `rows={1}` + CSS `max-height: 72px` but wasn't actually auto-growing — text would scroll internally instead of expanding the textarea height.

**Fix Applied:**
- Added `useRef` hook to reference the textarea element
- Created `handleChange` function that adjusts `textarea.style.height` to match `scrollHeight` (capped at 72px)
- Wired `onChange={handleChange}` on the textarea element
- Replaced inline `onChange={(e) => onChange(e.target.value)}` with the new handler

**Code snippet:**
```tsx
const textareaRef = useRef<HTMLTextAreaElement>(null);

function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
  onChange(e.target.value);
  const el = textareaRef.current;
  if (el) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
  }
}
```

### Finding 2 (Minor): Unused Import
**Issue:** `useState` was imported but never used in the component.

**Fix Applied:**
- Removed `import { useState } from "react";`
- Replaced with `import { useRef } from "react";` (required for Finding 1 fix)

## Verification

### TypeScript Compilation
```bash
npx tsc --noEmit
```
**Result:** ✓ No errors (clean output)

### Files Modified
- `components/home/CaptureDock.tsx` (+13 lines, -2 lines)

## Git Commit

```
Commit: 44ee594
Subject: fix: add auto-grow textarea behavior and remove unused useState import
Changes:
  - Added useRef to manage textarea height adjustment
  - Implement handleChange function that auto-grows textarea up to 72px max
  - Replace inline onChange with handleChange to wire height adjustment
  - Remove unused useState import, keep only useRef
```

## Status: DONE_WITH_FIXES

Both findings have been successfully applied and verified with TypeScript compilation.
