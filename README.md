<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Elastic--2.0-blue.svg" /></a>
  &middot;
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

## How it's built

- **Angular 22**, zoneless, pre-rendered at build time and hydrated in the browser.
- **Tailwind CSS 4** with a light and a dark theme, set in SOLIX, my own typeface.
- **Express 5** (`src/server.ts`) serves the page and its files, with health checks and Prometheus metrics.
- **Kubernetes**, deployed by Flux from `freek-mencke-web.yaml`.

## Running it locally

With Node 24 or later:

```bash
npm ci
npm start                          # dev server on http://localhost:4200
npm run build                      # then the production server on :8080, metrics on :9090:
npm run serve:ssr:freek-mencke-web
```

CI runs `npm run lint`, `npm run prettier:ci`, `npx knip`, `npm test` and `npm run build`.

## Deploy

Merging to `main` deploys: CD pushes the image to Docker Hub and commits its digest to `freek-mencke-web.yaml`, and Flux
rolls it out. Change the cluster only through this repo, as Flux reverts anything else. To roll back, `git revert` the
`chore(deploy)` commit and push.

## Licence

[Elastic License 2.0](LICENSE): read the code, learn from it, change it and run it yourself, but don't offer it to
others as a hosted service. SOLIX (`public/fonts/`) has its own terms.
