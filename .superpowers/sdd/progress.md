# Progress ledger — 2026-07-23-home-two-state-screen.md

Execution mode: Task 0-7 subagent-driven, Task 8-10 inline (per Olha's decision 23.07.2026).

## Env quirk (important — read before running git commands here)

This repo is mounted via FUSE into the sandbox; `unlink()` is blocked (delete-protection),
but `rename()` works. Git's lock cleanup uses unlink internally, so every git command that
takes a lock (add/commit/checkout) leaves a stale `.git/index.lock` / `.git/HEAD.lock` /
`.git/objects/maintenance.lock` behind, even on success (you'll see harmless
"warning: unable to unlink ..." lines — ignore them if the command's own exit code is 0).

**Before every git command in this repo**, clear stale locks first:
```bash
for f in .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock; do
  [ -e "$f" ] && mv "$f" "$f.stale-$RANDOM"
done
```
If a git command still fails with "Unable to create .../index.lock: File exists" after this,
run the same snippet again (a lock from the immediately-preceding command can appear after
the check) and retry once.

## Ledger

Base before Task 0: f1416da (WIP copy commit, unrelated to plan)
Task 0: complete (commits f1416da..c5cf97c, review clean)

## Env quirk 2: `npm run build` hangs/dies silently in this sandbox

Likely `next/font` fetching Google Fonts over network at build time (font domain may not be
reachable/allowlisted here) or a memory constraint — full `next build` was tried twice and
produced no output/error, process just disappeared after ~75s. Use `npx tsc --noEmit` instead
as the practical "does it compile" check for tasks in this plan — it's fast and doesn't touch
next/font. Confirmed working: exit 0 after Task 1's changes.

Task 0: complete (commits f1416da..c5cf97c, review clean)
Task 1: complete (commits c5cf97c..b4fd918, tsc --noEmit clean, review pending)
Task 1: complete (commits c5cf97c..2f94f43, one fix round: field ordering vs notes, review clean)
Task 2: complete (commits 2f94f43..3e7631d, controller committed manually after repeated git-lock failures in subagent, review clean, 5/5 tests)
Task 3: complete (commits 3e7631d..451b45b, one fix round: dropped compact-on-focus regression caught by reviewer, review clean)
Task 4: complete (commit 451b45b..59e1b39, review clean)
Task 5: complete (commits 59e1b39..44ee594, one fix round: auto-grow textarea + unused import, review clean)
Task 6: complete (commit 44ee594..6cdf5d6, accepted WITHOUT formal task-reviewer per Olha's request 23.07.2026 — implementer self-review + tsc --noEmit clean only)
Task 7: deferred — Olha asked to switch to inline screen-composition work (Task 8) before finishing Task 7 (swipe-delete + new-task highlight). Revisit later.
Task 8: complete (commit b113f9d..0648f42, inline, NO subagent/review per Olha's request 23.07.2026 — tsc clean, 6/6 tests pass). Wiring is temporary: dock mic-tap calls startRecording directly, full HomeScreen state machine is Task 9 (not started).
Task 9: complete (commit d69c4cf..6a8db5f, inline, NO subagent/review per Olha's request 23.07.2026 — tsc clean, 6/6 tests pass).
Fixed the Task-8 wiring gap noted earlier: PlanStage dock mic-tap now correctly calls expandToCapture (not startRecording directly), matching ToR 4.3 rule that recording only ever starts from the big button. CaptureStage's own dock mic-tap is now a no-op (already expanded). Old duplicate text-input section in app/page.tsx (separate from CaptureDock) was retired entirely — CaptureDock is now the single text-entry surface in both states, per ToR intent. Dropped the "Вставити приклад" dev-convenience link (was tied to the old textarea) — can re-add to CaptureDock if wanted.
Known gaps not covered by this task: 8.6 (mic-permission-denied dimming), 8.7 (swipe-to-cancel recording), aria-live announcements, focus management on state change — all deferred to Task 11 in the original plan.
