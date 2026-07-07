# CI / CD

## Continuous deployment — Vercel
Deploys happen automatically via Vercel's Git integration:
- Push to `main` → **production** deploy (`devora.design`).
- Any branch / PR → a **preview** deployment with its own URL.
- A failing build blocks the deploy.

## Continuous integration — GitHub Actions
`.github/workflows/ci.yml` runs on **every push to `main`** and **every pull request**:

```
npm ci  →  tsc --noEmit  →  eslint  →  next build
```

Watch runs under the repo's **Actions → CI** tab. Green = types, lint and build all pass.

---

## Branch protection — require CI to pass before merging to `main`

CI only *reports* status until you require it. To make a **red check actually block a merge**, turn on branch protection (a one-time GitHub setting — it can't live in the repo).

### Option A — Branch protection rule (classic)
1. Repo → **Settings → Branches → Add branch protection rule**.
2. **Branch name pattern:** `main`.
3. Tick **Require a pull request before merging** (this stops direct pushes to `main`).
4. Tick **Require status checks to pass before merging**, then search for and add the check **`Typecheck · Lint · Build`**.
   - The check only appears in the list **after CI has run at least once** — it already has, so it's selectable now.
5. *(Recommended)* Tick **Require branches to be up to date before merging**.
6. Click **Create**.

### Option B — Ruleset (newer GitHub UI)
1. Repo → **Settings → Rules → Rulesets → New branch ruleset**.
2. **Enforcement status:** Active.  **Target branches:** Default branch (`main`).
3. Enable **Require a pull request before merging** and **Require status checks to pass** → add **`Typecheck · Lint · Build`**.
4. Click **Create**.

### Trade-off to know before enabling
Requiring a PR means **you can no longer push straight to `main`** — every change goes through a branch + PR, and CI must be green to merge. With two people/sessions working in this repo now, that's the safer setup: it's what stops a red build (for example, the AI-support branch's current lint errors) from ever reaching production.

If you'd rather keep pushing directly to `main` for now, simply **skip the "Require a pull request" tick**. CI still runs and shows red/green on every push — it just won't *block* a bad push from deploying.

---

## Optional — CI status badge
Add to the top of `README.md`:

```md
![CI](https://github.com/MahmoudSghayer/devora/actions/workflows/ci.yml/badge.svg)
```

## Later — add the e2e suite to CI
When the end-to-end tests (`tests/e2e.mjs` + the `test:e2e` script) land on `main`, add a step to `ci.yml` that serves the app first, e.g.:

```yaml
      - run: npm run build
      - run: npm run start & npx wait-on http://localhost:3000
      - run: npm run test:e2e
```
