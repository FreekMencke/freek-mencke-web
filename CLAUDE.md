# freek-mencke-web

The personal site at https://freekmencke.com: one Angular 22 page (zoneless, standalone, Tailwind 4), pre-rendered at
build time and served by a small Express server (`src/server.ts`) on the home Kubernetes cluster. Develop, deploy and
rollback steps are in `README.md`.

**Load the `freek-mencke-web` skill before writing, reviewing, running, deploying or committing anything here.** It
holds this repo's specifics on top of `angular-conventions` and `angular-developer` (load those too): where the repo
differs from them, the design, local runs, the browser check and the commit steps. Keep detail there, not in this file.

## Commands

- Verify, the checks CI runs: `npm run lint`, `npm run prettier:ci`, `npm test`, `npm run build` and
  `shellcheck .github/scripts/*.sh`.
- One spec: `npx ng test --watch=false --include <path>`.
- Dev server: `npm start -- --port 4300` (osrs-tracker-web's sessions hold 4200).
- Claude Code formats every file it edits with Prettier, and runs `.claude/hooks/pre-push-check.sh` (lint and Prettier
  on the checkout being pushed) before each `git push`. Both are hooks in `.claude/settings.json`, not git hooks: a push
  from your own terminal skips them.

## Hard rules

- Doc-only changes (`CLAUDE.md`, `README.md`, `.claude/skills/`, `.claude/agents/`) go straight to `main`: commit in the
  worktree, `git fetch origin && git rebase origin/main`, then `git push origin HEAD:main`. For anything else, ask:
  `main` or a PR. `.claude/hooks/` and `.claude/settings.json` are tooling, not docs: they get that question too.
- Deploying is merging to `main` (GitHub Actions `CD` → Flux). Never build or push an image or `kubectl apply` by hand.

## Where things live

- `src/app/home/` the page's sections; `src/app/common/` the layout, the carousel and `seo/` (page meta).
- `src/server.ts` the Express server: static files and their caching, the pre-rendered page, health and metrics.
- `freek-mencke-web.yaml` the Kubernetes manifest; `.github/workflows/` CI and CD, `.github/scripts/` CD's steps.
- `.claude/agents/conventions-reviewer.md` reviews diffs against the skill and this file; `browser-checker.md` runs the
  skill's browser check; `.claude/hooks/read-only-bash.sh` keeps the reviewer to git, gh and grep reads.
