---
name: freek-mencke-web
description:
  This repo's specifics on top of angular-conventions for freek-mencke-web, the personal site at freekmencke.com: where
  it differs from the house rules, the design system, pre-rendering, local runs, the browser check,
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
app: look there for a pattern this repo doesn't have yet.

## The app

- One page, `home/`, inside `common/root-layout/` (the sticky bar: wordmark, Projects, About and the theme toggle). In
  order: `hero/` (the green field, `#top`), `projects/` (`#projects`: `osrs-tracker/` featured, then the two smaller
  ones with `terminal-card`) in `<main>`, and `about/` (`#about`, the green footer). The bar's links are fragments of
  `/`, scrolled to by `withInMemoryScrolling`; every other path redirects to `/` (`app.routes.ts`, a 302 from the
  server).
- **State**: `common/theme/ThemeStore` (light or dark, kept in `localStorage` under `theme`) and
  `common/root-layout/BarStore` (whether the hero is under the bar, which the hero sets with an `IntersectionObserver`).
- **Theme**: the inline script in `src/index.html` sets `.dark` on `<html>` and the `theme-color` meta before the first
  paint, from the stored choice or the system's. `ThemeStore` reads the class after render and toggles both; its ground
  colours are copies of the script's and `base.css`'s, so change all three together.
- **Page meta**: `PageMetaStrategy` (`common/seo/page-meta.strategy.ts`) sets the title from the route's `title`, and
  the description, canonical link and `og:`/`twitter:` tags from the deepest route's `data['meta']` (a `PageMeta`). A
  new page's lazy route gets both; `src/index.html` holds no meta.
- `public/`: images per project (`projects/<project>/`, WebP), the font, the light and dark favicons, `robots.txt` and a
  hand-written `sitemap.xml`: bump its `<lastmod>` when the page's content changes, and add a page.

## Where this repo differs from `angular-conventions`

Decided after a review of the whole codebase against both skills (2026-10-14):

- The build pre-renders the page in Node: browser-only APIs (`window`, `IntersectionObserver`, layout reads) run in
  `afterNextRender` or an event handler, never in a constructor or field initialiser (`hero.component.ts`).
- Imports use the `@app/…` alias across `common/` and `home/`, relative within them. ESLint's
  `import-x/no-restricted-paths` keeps `common/` from importing `home/`, and app code from importing `src/server.ts`.

## Design

Designed on the canvas https://claude.ai/artifact/DP3jSVavjuymjpv5zc4oBS (direction "Colour field"): look there before
changing the page's look, and keep the two in step.

- **Idea**: one bold thing, a deep green field, opens the page (the hero) and closes it (the footer). Everything between
  is quiet: the light ground, thin type, centred project heads.
- **Colours**: semantic tokens only (`theme.css`, the light values; `.dark` in `base.css` swaps them; the stock palette
  is cleared). `ground` the page, `line` hairlines, `ink` text, `muted` secondary text, `accent` links' hover and the
  website years, `edge` the hairline around screenshots; `field` the green, `on-field`, `field-muted` and `field-accent`
  on it. Dark is a near-black in the field's own green (`#0b1613`), not OSRS Tracker's navy: navy clashes with the
  green. A tint is `color-mix(in oklch, <token> N%, transparent)`.
- **Type**: SOLIX 3.00, cut to weights 100–700 from the release (osrs-tracker-web's skill has the commands; this repo
  cuts `wght=100:700`, for MENCKE's 100), preloaded in `index.html` and declared in `base.css`, both with `?v=`. Project
  names `text-display` (OSRS Tracker) and `text-title`, weight 300; body `text-lg/7.5`; meta `text-sm/5` in `muted`; the
  footer's first line `text-statement`. The wordmark: FREEK 600, MENCKE 100, wide tracking, uppercase; on phones stacked
  at 20vw, FREEK at 1.32em and weight 400 so both lines are as wide. Monospace only for the tagline and the terminals.
- **Layout**: `px-page` (the gutter plus safe areas), `max-w-page` sections, `max-w-152` text columns centred. Space
  between big parts is `section`/`section-sm`; the bar is `bar` tall (`bar-phone` below `sm`), and the hero and footer
  slide under it with `scroll-mt-bar` on fragment targets.
- **Motion**: only the hero's typed tagline (CSS, resting on the finished text) and the bouncing arrow, both off under
  reduced motion; the bar fades from see-through to blurred when the hero leaves it.
- **Images**: WebP in `public/`, through `NgOptimizedImage` with `width` and `height`. OSRS Tracker's screenshots are
  its light theme in both page themes, dimmed to 90% on a dark page. They show live data (a price, a player), so retake
  them now and then: the home page at 1440x800 at 1.5x, the item (`/trackers/price/4151`) and player
  (`/trackers/xp/The%20Fraking`) pages at 1440x1100 at 2x, cropped to the header, stat cards and chart, without the
  cookie banner, 1400px wide.

| Piece                                | Where                                                           |
| ------------------------------------ | --------------------------------------------------------------- |
| Sticky bar, nav, theme toggle        | `common/root-layout/`, `common/theme/theme-toggle.component.ts` |
| Social links (hero and footer)       | `common/social-links/`                                          |
| Green field background, link style   | `.field`, `.link` in `components.css`                           |
| Hero: wordmark, typed tagline, arrow | `home/hero/`                                                    |
| Screenshots and timeline             | `home/projects/osrs-tracker/`                                   |
| Terminal cards                       | `home/projects/terminal-card.component.ts`                      |
| Footer bio                           | `home/about/`                                                   |

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

- Desktop (1280px) and phone (390px), each in light and dark (emulate `prefers-color-scheme`, or click the toggle): the
  wordmark, the tagline, the screenshots and the timeline change layout between the widths.
- Click the bar's links, the hero's arrow and the theme toggle from snapshot refs, never by guessing. After a toggle,
  reload: the page must open in the chosen theme without a flash of the other.
- Scroll past the hero: the bar turns solid and shows the wordmark.
- A screenshot per URL, width and theme, plus failed requests (an image under `/projects/`) and console errors.
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

- The differences from `angular-conventions` above are the repo's rules: don't flag them. **violates**: a palette colour
  or a `dark:` colour pair instead of a token from `## Design`, an arbitrary value (`w-[13px]`), and
  `@angular/animations` (removed in v23; CSS or `animate.enter`/`animate.leave` instead).
- Rules that span files, checked against the whole diff: a new page and its route `title`, `data['meta']` and
  `sitemap.xml` entry; a new file outside the build and `NOT_IN_IMAGE` plus `.dockerignore`.
- **breaks** here also covers: a browser-only API outside `afterNextRender` or an event handler (the pre-render fails or
  renders differently from the browser).
