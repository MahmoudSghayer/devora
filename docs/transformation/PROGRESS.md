# Devora transformation — PROGRESS

Branch: `claude/zen-wright-dca3b6` · Executor: Sonnet session · Started 2026-11-15

## Status
| Phase | Status |
|---|---|
| 0 Research & baseline | in progress |
| 1 Foundations | in progress (pricing config, vitest, merge-ns tool done) |
| 2 Lead backend | queued |
| 3 Estimator | queued |
| 4 ROI calculator | queued |
| 5 Homepage & services | queued |
| 6 SEO/perf/a11y | queued |
| 7 Testing & QA | queued |
| 8 Docs & report | queued |

## Decisions
- `@types/node` bumped ^20 → ^24 (vitest 5 peer requirement; CI runs Node 24).
- Messages are edited via `scripts/merge-ns.mjs` (atomic per-namespace, enforces ar/en key parity) so parallel agents don't clobber each other.
- Agents do not commit; the executor stages explicit paths and commits per phase.

## Open issues / blockers
(none yet)
