---
name: freek-mencke-web
description:
  This repo's specifics on top of angular-conventions for freek-mencke-web, the personal site at freekmencke.com: where
  it differs from the house rules, the design and the coming redesign, pre-rendering, local runs, the browser check,
  deploy and commit rules. Use when writing or reviewing code in this repo, redesigning the site, running it locally,
  checking it in the browser, or deploying, committing, pushing or releasing it.
---

# freek-mencke-web

Detailed guide; the always-on summary, commands and hard rules are in `CLAUDE.md` and aren't repeated here. The
`conventions-reviewer` agent reviews diffs against this file, `angular-conventions` and `CLAUDE.md`, and
`browser-checker` follows `## Browser check` and `## Design`, both at runtime: keep rules here, not in the agents.

General Angular rules are in the `angular-conventions` skill, on top of Angular's `angular-developer`: load both. This
skill holds this repo's specifics and wins where they differ. Without `angular-conventions` (cloud sessions don't load
personal skills), say so instead of guessing its rules. `~/repos/osrs-tracker-web` follows the same rules on a bigger
app: look there for a pattern this repo doesn't have yet (semantic colour tokens, ESLint layers).

## The app

- One page: `home/` (the `landing`, `projects` and `about` sections) inside `common/root-layout/` (the fixed nav, the
  mobile menu button, the social links). The nav links are fragments of `/` (`#projects`, `#about`), scrolled to by
  `withInMemoryScrolling`; every other path redirects to `/` (`app.routes.ts`, a 302 from the server).
- `common/image-carousel/` shows a project's screenshots, with a full-screen overlay that locks the page's scroll.
- **Page meta**: `PageMetaStrategy` (`common/seo/page-meta.strategy.ts`) sets the title from the route's `title`, and
  the description, canonical link and `og:`/`twitter:` tags from the deepest route's `data['meta']` (a `PageMeta`). A
  new page's lazy route gets both; `src/index.html` holds no meta.
- `public/`: images per section (`about/`, `projects/<project>/`, WebP), the font, the light and dark favicons,
  `robots.txt` and a hand-written `sitemap.xml`: bump its `<lastmod>` when the page's content changes, and add a page.

## Where this repo differs from `angular-conventions`

Decided after a review of the whole codebase against both skills (2026-10-14):

- Imports are relative for now, only because the structure is two folders (`common/`, `home/`). Once it grows (the
  redesign), add the `@app/…` alias and the ESLint layers. Until then `common/` never imports `home/`, and app code
  never imports `src/server.ts`.
- The page is pre-rendered at build time, makes no HTTP calls and the server sends no CSP, so the async data, state and
  per-request SSR rules (CSP nonce, transfer cache, third-party calls, writes) don't apply. The build does render the
  page in Node: browser-only APIs (`window`, `requestAnimationFrame`, layout reads) run in `afterNextRender` or an event
  handler, never in a constructor or field initialiser (`scroll-shadow.directive.ts`).

**Known debt the redesign clears**. Leave it in small edits; don't add more of it:

- Templates under 80 lines in `.html` files (`root-layout`, `projects`, `about`, `landing`, `home`).
- Arbitrary values (`z-[1000]`, `min-h-[32rem]`, `h-[24em]`, `sm:max-w-[90vw]`…) instead of theme tokens.
- Palette colour classes (`text-primary-500`, `bg-secondary-100`) instead of semantic tokens, and unused dark mode
  machinery (`dark:` pairs in `.link`, `.link-states--dark`, the `.dark` variant: nothing sets `.dark`).
- `leading-tight` with `xl:text-3xl` on the landing's tagline (a 37.5px line height).
- Accessibility: three `<h1>`s, a menu button without `aria-expanded`, an overlay without Escape or keyboard close.
- Sizeless `@defer` placeholders in `projects` and `about`, and plain `<img>`s (the selfie, the overlay) without `width`
  and `height`.
- `@angular/animations` in the carousel (`provideAnimations()` in `app.config.ts`): deprecated since 20.2, removed in
  v23, so it goes in the redesign or the v23 update, whichever comes first. New animations use
  `animate.enter`/`animate.leave` or CSS.

## Design

The current design, until the redesign replaces it:

- **Font**: SOLIX (variable, weights 300–700), the same file as osrs-tracker-web's
  `public/assets/fonts/SOLIX-Variable.woff2`, preloaded in `src/index.html` and declared in `base.css`, both with `?v=`.
  To update it, copy that file once osrs-tracker-web has a new one (its skill's Font rule cuts it) and bump `?v=` in
  both files.
- **Colours** (`src/styles/tailwind/theme.css`): a green `primary` scale and a slate `secondary` scale. The page is
  `bg-secondary-100` with `text-secondary-800`; `.link-states` (`components.css`) colours links' hover and active
  states. Light only.
- **Layout**: Tailwind's `container mx-auto`; the landing fills the screen (`fill-screen`), and `sa-t`/`sa-l`/`sa-r`/
  `sa-b` pad for the safe areas (`viewport-fit=cover`) (`utilities.css`). The nav switches to the menu button below
  `lg`.
- **Images**: WebP in `public/`, through `NgOptimizedImage`: `ngSrc` with `width` and `height`, or `fill` in a sized box
  (the carousel).

**Redesign**: design it on a Design canvas artifact first and let the user look, as osrs-tracker did. Its skill's
`## Design system` shows the result to aim for: a link to the canvas, semantic colour tokens that swap under `.dark`,
surfaces, radii, type, spacing, phone rules and a which-component table. Then replace this section with the same, and
the palette classes with the tokens.

## Tests

- Specs only for logic that's complex or important; `common/seo/page-meta.strategy.spec.ts` shows the pattern (`TestBed`
  with `provideRouter`, then assert on the document). Break the code once to see a new spec fail.
- `ng test` fails with no spec at all, so don't delete the last one without a replacement.

## Running locally

- Worktrees in `.claude/worktrees/` use the main checkout's `node_modules`, which match its lockfile: if
  `diff -q package-lock.json ../../../package-lock.json` reports a difference, run `npm ci` in the worktree.
- The dev server (`CLAUDE.md`): check `ss -ltn | grep :4300` first, and stop it when done.
- `src/server.ts` needs the production build: `npm run build` (about 5 s; it pre-renders `/` and deletes the browser
  build's `index.csr.html`, which `npx ng build` keeps), then
  `PORT=4301 METRICS_PORT=9301 npm run serve:ssr:freek-mencke-web` (the defaults, 8080 and 9090, are often taken). Smoke
  test with `curl -s -D - http://localhost:4301/<path>`: `/` is 200 with `Cache-Control: no-cache`, an unknown path a
  302 to `/`, a missing file (`/x.js`) a 404, `/healthy` 200 on both ports, `/metrics` on 9301. Stop it with
  `lsof -ti:4301 -sTCP:LISTEN | xargs -r kill`.
- The image as the cluster runs it (read-only, uid 1000, no capabilities): the `docker run` in CI's `image` job
  (`.github/workflows/nodejs.yml`), after `npm run docker:build`.

## Browser check

For visible changes, check the page in the browser locally, and on https://freekmencke.com after the deploy (curl only
sees the server's HTML). If Playwright is unavailable, say so rather than falling back to curl silently.

1. Start the server yourself (see Running locally); for production, wait for the deploy.
2. Delegate every round to the `browser-checker` agent (without a `model`), with the URLs and what changed, so its
   screenshots stay out of the main session. It starts its own headless, isolated browser.
3. Pass on its `VERDICT:`, failed requests and console errors, and send its screenshots with `SendUserFile` without
   `Read`ing them: it has looked. Then delete them and `.playwright-mcp/`, and stop the server.

The rules it follows (it reads them here):

- Desktop (1280px) and phone (390px) for every change: the nav and the sections change layout between them.
- Light mode only, until the redesign adds a dark theme.
- Click the menu button, the nav links, the carousel's previous and next buttons and its overlay from snapshot refs,
  never by guessing.
- A screenshot per URL and width, plus failed requests (an image under `/about/` or `/projects/`) and console errors.
- Close the browser as soon as the round of checks is done.

## Deploy

The flow and the rollback are in `README.md`. For a session:

- Merging to `main` is the deploy, and the end of the job: don't wait for or watch the `CD` run unless the user asks. A
  failure shows as a failed `CD` run titled after the change.
- CD skips a commit that changes only files outside the image: `NOT_IN_IMAGE` in `.github/workflows/deploy.yml` (the
  manifest, `.claude/`, `.github/`, `.vscode/`, `README.md`, `CLAUDE.md`, `.mcp.json`, `.gitignore`). A new file that
  isn't part of the build goes in that list and in `.dockerignore`, or every change to it redeploys.
- `freek-mencke-web.yaml` reaches the cluster through Flux without a new image, and CI ignores pushes that change only
  it.

## Commit and push

- Conventional commits (`feat(scope): …`, `chore(deps): …`); `chore(deploy)` is reserved for CD's digest commits. No
  changelog.
- What goes straight to `main` and what needs a PR: `CLAUDE.md`. `main` isn't protected, so a direct push is a deploy
  once CI passes.
- PRs: branch `<type>/<short-name>` (in a worktree, `git switch -c` from the `claude/…` branch), push,
  `gh pr create --base main`. Review with two subagents in parallel, without `model`: `conventions-reviewer`, and a
  `general-purpose` agent that runs `/code-review high <n>` and returns only its findings. Check each finding against
  the code before fixing it. Then `gh pr checks <n> --watch` as a background command, and `gh pr merge <n> --squash`
  once they pass (the repo squash-merges: titles end in `(#n)`).

## Review rules

What `conventions-reviewer` checks beyond the rules above. It reads this section; keep repo rules here, not in the
agent.

- The differences from `angular-conventions` above are the repo's rules: don't flag them. Known debt the redesign clears
  is flagged only where the diff adds to it (a new `dark:` pair, an arbitrary value, a new short `.html` template, a new
  `@angular/animations` trigger): **violates**.
- Rules that span files, checked against the whole diff: a new page and its route `title`, `data['meta']` and
  `sitemap.xml` entry; a new file outside the build and `NOT_IN_IMAGE` plus `.dockerignore`.
- **breaks** here also covers: a browser-only API outside `afterNextRender` or an event handler (the pre-render fails or
  renders differently from the browser).
