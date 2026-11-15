# Devora transformation — PROGRESS

Branch: `claude/zen-wright-dca3b6` · Executor: Sonnet session · Started 2026-11-15

## Status
| Phase | Status |
|---|---|
| 0 Research & baseline | DONE (docs/research/zawiya-studio.md, AUDIT.md; baseline screenshots in scratchpad) |
| 1 Foundations | DONE (tokens v2, motion primitives, Lenis, ViewTransition, header/footer IA, pricing single source, unified process) |
| 2 Lead backend | DONE (migration 0002 committed NOT applied; lib/leads; routes; emails; admin; 93 unit tests) |
| 3 Estimator | engine DONE + tested; UI in progress |
| 4 ROI calculator | engine DONE + tested; UI in progress |
| 5 Homepage & services | in progress (sections + three module + services/pages agents running) |
| 6 SEO/perf/a11y | queued |
| 7 Testing & QA | queued |
| 8 Docs & report | queued |

## Decisions
- `@types/node` bumped ^20 → ^24 (vitest 5 peer requirement; CI runs Node 24).
- Messages are edited via `scripts/merge-ns.mjs` (atomic per-namespace, enforces ar/en key parity) so parallel agents don't clobber each other.
- Agents do not commit; the executor stages explicit paths and commits per phase.

## Open issues / blockers
(none yet)


---
## PAUSED — snapshot for design preview (orchestrator request)
All subagents were stopped mid-work (TaskStop) and the tree committed as a WIP checkpoint. `npx tsc --noEmit` passes at checkpoint; `next build` not re-run. **Resume only on an orchestrator message starting with "RESUME".**

### Done & committed (stable)
- Phase 0: `docs/research/zawiya-studio.md`, `docs/transformation/AUDIT.md`.
- Phase 1: tokens v2 + utilities in `app/globals.css`, motion primitives (`components/motion/*`, `lib/hooks/*`, `lib/scroll`), Lenis, ViewTransition (`template.tsx`, `next.config.ts`), Header/Footer IA, `lib/pricing/config.ts` (+`budget.ts`), unified process copy, `pillars` namespace + `lib/pillars.ts`, e2e price/aria fix, CI runs `npm test` + SMTP test, `docs/design-system.md`.
- Phase 2: complete (migration 0002 committed, NOT applied; `lib/leads/*`; `/api/{estimate,automation-roi,contact,lead}`; email templates; admin leads UI; ContactForm on shared service). 93 vitest tests + `tests/email-smtp.mjs` pass.
- Engines `lib/estimator/*`, `lib/roi/*` done and tested (47 tests).

### Half-done (files exist; agent killed mid-work)
- **Estimator UI** (`components/estimator/{model.ts,storage.ts,steps/}`): state/model + some steps only. MISSING: `EstimatorApp`, live panel/bottom sheet, summary+form, success, `app/[locale]/(marketing)/estimate/page.tsx`, `estimator` namespace in messages (keys list: `docs/transformation/estimator-i18n-keys.json`).
- **ROI UI** (`components/roi/{model.ts,TaskPicker,Workload,Labor,Potential,ui,icons,format,charts/}`): steps 1-4 + chart dir started. MISSING: results dashboard, lead form, success, `RoiApp`, `automation-roi/page.tsx`, `roi` namespace (+ `roi.task.<id>`/`roi.why.<id>`).
- **Three module** (`components/three/{AuraScene,AuraSceneLazy}.tsx`, `lib/three/{scene,shaders}.ts`): written, unverified (WebGL/poster/reduced-motion/dispose tests not completed). Temp route `app/[locale]/(marketing)/aura-test/` must be DELETED.
- **Homepage A** (`components/sections/{Hero,ProofStrip,ValueProps,CtaBand}.tsx`, ns `hero`): written, was in visual verification. Temp route `homea-tmp/` must be DELETED.
- **Homepage B** (`PillarSwitcher`, `ScenarioSimulator`, `CalculatorCards` + `sections/{pillars,simulator,calculators}/`): written, unverified. Temp route `homeb-tmp/` must be DELETED. Namespace `homeB` may be partly merged.
- **Homepage C** (`components/sections/stack/`, `lib/stack.ts`): only stack scaffolding; MISSING `StackConstellation`, `ProcessTimeline`, `WhyDevora`, `SelectedWork`, `HomeFaq` and ns `stack`/`why`/`homeFaq`.
- **Pages agent**: `/services` partly rebuilt (`components/services/{PillarNav,PillarSection,PillarHelper,pillarTint}`, DisciplineRows deleted), pricing restyled (`CustomNeeds`), messages `services` being rewritten (may be inconsistent); about/process/work/industries/faq/contact/404 NOT done.
- **SEO agent**: `lib/seo/*`, OG/twitter image rewrite in progress (Cairo font loading); metadata helper/JSON-LD components/sitemap/`SEO-WIRING.md` status unknown — verify.

### Not started
Homepage assembly (move `app/[locale]/page.tsx` into `(marketing)`, delete `lib/experience`, `components/experience`, `components/home`, `experience` + old `home` namespaces, experience CSS), scoped client messages, chat widget deferral, Lighthouse/a11y pass, Playwright E2E for calculators, visual QA, review pass, README, REPORT.md.
