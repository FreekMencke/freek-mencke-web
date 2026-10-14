import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OsrsTrackerComponent } from './osrs-tracker/osrs-tracker.component';
import { TerminalCardComponent, TerminalLine } from './terminal-card.component';

/**
 * OSRS Tracker first and large, then the two smaller projects side by side. The terminal shows real deployments from
 * `kubectl get deployments -A`, a few of them.
 */
@Component({
  selector: 'projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OsrsTrackerComponent, TerminalCardComponent],
  host: { class: 'block' },
  template: `
    <section
      id="projects"
      class="mx-auto max-w-page scroll-mt-bar-phone px-page pt-section-sm sm:scroll-mt-bar"
      aria-labelledby="projects-title"
    >
      <h2 id="projects-title" class="sr-only">Projects</h2>

      <osrs-tracker />

      <div class="mx-auto mt-section flex max-w-wide flex-wrap gap-x-16 gap-y-18">
        <article class="min-w-0 grow basis-80 text-lg/7.5">
          <header>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 class="text-title font-light tracking-wide">Node TS Starter CLI</h3>
              <span class="rounded-full border border-line px-2.5 text-xs/5.5 text-muted">Archived</span>
            </div>
            <p class="mt-1 text-sm/5 text-muted">Node.js, TypeScript, esbuild</p>
          </header>
          <p class="mt-4">
            In 2019 I wrote
            <a
              class="link"
              href="https://medium.com/@freek_mencke/how-to-write-node-js-applications-in-typescript-a54af696f66"
              target="_blank"
              rel="noopener"
              >how to write Node.js apps in TypeScript</a
            >, with a starter project to go with it. This CLI was the follow-up: I start a lot of side projects, so I
            turned that boring first hour into one command, with strict TypeScript, esbuild and, if you asked, ESLint,
            Prettier, Docker and GitHub Actions.
          </p>
          <terminal-card
            command="npx node-ts-starter-cli create my-app -M"
            label="Terminal: npx node-ts-starter-cli create my-app -M"
          />
          <p class="mt-5">
            <a class="link" href="https://github.com/FreekMencke/node-ts-starter-cli" target="_blank" rel="noopener"
              >Source on GitHub</a
            >
          </p>
        </article>

        <article class="min-w-0 grow basis-80 text-lg/7.5">
          <header>
            <h3 class="text-title font-light tracking-wide">fremen-server</h3>
            <p class="mt-1 text-sm/5 text-muted">Kubernetes, Flux, Traefik, Grafana Cloud</p>
          </header>
          <p class="mt-4">
            The single-node Kubernetes cluster in my house. It runs this site, OSRS Tracker and its API. Flux deploys
            whatever lands on main, CrowdSec bans whoever knocks too hard, and Grafana Cloud tells me when something
            falls over.
          </p>
          <terminal-card
            command="kubectl get deployments -A"
            [output]="deployments"
            label="Terminal: some of the deployments running on the cluster"
          />
          <p class="mt-5 text-sm/5 text-muted">No public repo: it's my house.</p>
        </article>
      </div>
    </section>
  `,
})
export class ProjectsComponent {
  protected readonly deployments: TerminalLine[] = [
    { text: 'NAMESPACE     NAME                   READY', muted: true },
    { text: 'freek-mencke  freek-mencke-web       2/2' },
    { text: 'osrs-tracker  osrs-tracker-web       2/2' },
    { text: 'osrs-tracker  osrs-tracker-api       2/2' },
    { text: 'flux-system   kustomize-controller   1/1' },
    { text: 'traefik       traefik                1/1' },
    { text: 'crowdsec      crowdsec-lapi          1/1' },
    { text: '… and more', muted: true },
  ];
}
