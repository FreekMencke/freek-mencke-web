# freek-mencke-web

The personal site at https://freekmencke.com: one Angular 22 page (zoneless, standalone, Tailwind 4), pre-rendered at
build time and served by a small Express server (`src/server.ts`) on the home Kubernetes cluster. Develop, deploy and
rollback steps are in `README.md`.

**Load the `angular-conventions` skill (with `angular-developer`) before writing or reviewing code here.** Keep its
rules there, not in this file.

## Commands

- Verify, the checks CI runs: `npm run lint`, `npm run prettier:ci`, `npm run build`, `npm test` and
  `shellcheck .github/scripts/*.sh`.
- Deploying is merging to `main` (`README.md`). Never build or push an image or `kubectl apply` by hand.

## Where this repo differs from `angular-conventions`

- File and class names keep their role suffix (`home.component.ts`, `AppComponent`, `target-blank.directive.ts`), which
  the 2025 style guide drops. New files follow the suffixed names too, so the repo stays consistent until a rename.
- The page is pre-rendered at build time and makes no HTTP calls, and the server sends no CSP, so the per-request SSR
  rules (CSP nonce, transfer cache, third-party timeouts, writes) don't apply.
