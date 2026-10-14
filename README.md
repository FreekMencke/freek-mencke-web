# freek-mencke-web

The personal site at [freekmencke.com](https://freekmencke.com): one Angular page, pre-rendered at build time and served
by a small Express server (`src/server.ts`) on the home Kubernetes cluster.

## Develop

```bash
npm ci
npm start                          # dev server on http://localhost:4200
npm run build                      # dist/freek-mencke-web: browser/ and server/
npm run serve:ssr:freek-mencke-web # the production server on http://localhost:8080, metrics on :9090
npm run lint && npm run prettier:ci
```

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
