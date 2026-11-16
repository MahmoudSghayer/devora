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

- **OWNER AMENDMENT (relayed by orchestrator):** (1) Packages (Launch/Studio/Growth) are DROPPED from all UI/copy/emails/prompts/e2e; `lib/pricing/config.ts` stays the single source for estimator prices + maintenance options (tiers no longer surfaced; `recommended_package` column unused). `/pricing` = "How pricing works"; Pricing removed from header nav (footer + sitemap keep it). (2) THREE guided option-based flows: `/estimate` (goal → size → type → requirements → design → integrations), `/automation-roi` (task → bucketed workload → labour bands → standardisation → exact-numbers toggle), NEW `/discuss` (custom-software discovery; engine `lib/discuss`). (3) All three end with summary + Edit links, then form with free-text notes + consent. (4) Backend: migration 0002 edited to add `software_discovery`; `/api/discuss`; `softwareDiscoveryEmail`; admin badge/filter; `discuss_submitted`; SKIP_NS. (5) Homepage: three calculator cards; pillar CTAs → /estimate, /automation-roi, /discuss; /contact opens with the three guided paths.

- **PUSH RULE (orchestrator):** never push a non-green commit. Before every push: `npm run typecheck && npm run lint && npm test && npm run build`. WIP is committed locally only; Vercel builds every push to this branch. Last green-unverified push (9c24d67) failed to build (estimator WIP imports) — fixing is top priority once the UI agents finish.

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

---
## RESUMED (orchestrator RESUME received)
Owner decisions applied: particle DevoraMark WebGL hero (poster-only on phones/reduced-motion/no-WebGL, CSS-only breathing glow); 8-section homepage (Hero · Value+Why+proof · Pillars · WhatsApp simulator · Selected work · Calculator cards · Stack · CTA; no process/FAQ sections — linked instead); amber + signal-blue (automation/AI/data only). Review fixes assigned: hero H1 display size, pillars overflow, /pricing gap, remove stats row. Phase 7: per-page overflow assertion at 390/1440 both locales.
Running agents (6): particle hero, estimator UI, ROI UI, homepage sections, pages (+faq/process/pricing fixes), SEO. Orchestrator (me) will assemble the homepage, delete the experience monolith, wire SEO, then perf/QA/review/docs.


---
## Checkpoint (green) — after usage-limit recovery
- Recovered: working tree intact; perf agent's partial work (lazy chat widget, self-hosted Cairo woff2 + AR-only preload, scoped client messages via `ScopedMessages`, starter SVGs removed) kept — typecheck/lint/test/build all green.
- **SSG restored**: marketing layout now takes `params`, calls `setRequestLocale`, passes explicit locale to `getTranslations`; `next build` lists ● for every `/[locale]` marketing page in both locales (only the `[...rest]` 404 catch-all, OG/twitter images and API/admin are ƒ).
- Done: engines (+goals/size, ROI buckets, discuss), backend (+discuss, tiers removed), all three guided flows' UI, pages (pricing = How pricing works, contact paths, services, faq/process…), SEO (pageMetadata + JSON-LD verified on 26 routes), homepage 8 sections, hero particle mark.
- Remaining: perf measurement (Lighthouse), a11y axe pass, E2E for all three flows EN/AR + overflow assertion, visual QA, review pass, README + docs + REPORT.md, PROGRESS=DONE. Max 2–3 parallel subagents from now on.
