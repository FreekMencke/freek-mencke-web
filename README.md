<p align="center">
  <a href="https://github.com/FreekMencke/freek-mencke-web/actions/workflows/nodejs.yml"><img src="https://github.com/FreekMencke/freek-mencke-web/actions/workflows/nodejs.yml/badge.svg" /></a>
  <a href="https://github.com/FreekMencke/freek-mencke-web/actions/workflows/deploy.yml"><img src="https://github.com/FreekMencke/freek-mencke-web/actions/workflows/deploy.yml/badge.svg" /></a>
</p>

<div align="center">
  <a href="https://freekmencke.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/favicon-dark.png">
      <img alt="Freek Mencke" src="public/favicon.png" width="128">
    </picture>
    <div>Visit freekmencke.com</div>
  </a>

  <br />

  <p align="center">Doing the coding thing. Creating cool shit.<br>The personal site of Freek Mencke, a full-stack TypeScript developer from Belgium.</p>
</div>

## What's on it

One page, in light and dark:

- **The hero**: a deep green field with the name, a typed-out tagline and the socials.
- **Projects**: [OSRS Tracker](https://osrs-tracker.freekmencke.com) with screenshots and its timeline, then
  [Node TS Starter CLI](https://github.com/FreekMencke/node-ts-starter-cli) and the Kubernetes cluster in my house, each
  with a terminal card.
- **About**: who I am, on the hero's green, so the page opens and closes on it.

## How it's built

- **Angular 22**: standalone and zoneless, with NgRx signal stores. The page is pre-rendered at build time and hydrated
  in the browser.
- **Tailwind CSS 4** with semantic colour tokens for the two themes, set in SOLIX, a typeface of my own (its terms are
  in `public/fonts/LICENSE.txt`).
- **Express 5** (`src/server.ts`) serves the pre-rendered page and the static files (hashed ones cached for a year),
  plus health checks and Prometheus metrics on a separate port.
- **Hosting**: a Docker image on a single-node Kubernetes cluster at home, deployed by Flux from this repo's manifest
  (`freek-mencke-web.yaml`).

## Running it locally

You need Node 24 or later.

```bash
npm ci
npm start                          # dev server on http://localhost:4200
npm run build                      # dist/freek-mencke-web: browser/ and server/
npm run serve:ssr:freek-mencke-web # the production server on http://localhost:8080, metrics on :9090
```

Before pushing, run the checks CI runs:

```bash
npm run lint && npm run prettier:ci && npx knip && npm test && npm run build
```

`npm run prettier` fixes formatting. Working with Claude Code? `CLAUDE.md` and the `freek-mencke-web` skill in
`.claude/skills/` hold the conventions, the design and the browser check.

## Deploy

Merging to `main` deploys: once CI passes, the `CD` workflow (`.github/workflows/deploy.yml`) builds and pushes
`freekmencke/freek-mencke-web` to Docker Hub, commits the image digest to `freek-mencke-web.yaml`, waits for Flux to
apply it (the `Flux / sync` commit status) and smoke-tests the site. Flux's wiring for this repo lives in the private
home-cluster repo. Don't `kubectl apply` the manifest or push an image by hand: Flux reverts it within 10 minutes.

`freek-mencke-web.yaml` holds everything in the `freek-mencke` namespace: the Deployment, Service, the Ingresses for
`freekmencke.com` and `www` (which redirects to the apex), and their Traefik middlewares. Flux applies a change to it
without a new image.

**Rolling back:** `git revert` the `chore(deploy)` commit on `main` and push. Flux applies the previous digest within a
minute; CD skips the revert.

Repository secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.
