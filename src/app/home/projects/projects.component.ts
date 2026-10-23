import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OsrsTrackerComponent } from './osrs-tracker/osrs-tracker.component';
import { TerminalCardComponent, TerminalLine } from './terminal-card.component';

/**
 * OSRS Tracker first and large, then the two smaller projects side by side once each is wide enough for its whole
 * terminal at `sm:text-sm` (`basis-104`; the kubectl table needs about 400px), stacked below that, in text columns
 * (`max-w-152`) `section-sm` apart. The terminal shows
 * a few of the real workloads from `kubectl get all -A`, without the kind kubectl puts before each name.
 */
@Component({
  selector: 'projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OsrsTrackerComponent, TerminalCardComponent],
  host: { class: 'block' },
  template: `
    <section id="projects" class="mx-auto max-w-page px-page pt-section-sm" aria-labelledby="projects-title">
      <h2 id="projects-title" class="sr-only">Projects</h2>

      <osrs-tracker />

      <div class="mx-auto mt-section flex max-w-wide flex-wrap gap-x-16 gap-y-section-sm">
        <article class="mx-auto min-w-0 max-w-152 grow basis-104 text-lg/7.5">
          <header>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 class="text-title font-light tracking-wide text-balance">Node TS Starter CLI</h3>
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

        <article class="mx-auto min-w-0 max-w-152 grow basis-104 text-lg/7.5">
          <header>
            <h3 class="text-title font-light tracking-wide text-balance">fremen-server</h3>
            <p class="mt-1 text-sm/5 text-muted">Kubernetes, Flux, Traefik, Grafana Cloud</p>
          </header>
          <p class="mt-4">
            My single-node Kubernetes cluster, on a VPS. It runs this site, OSRS Tracker, its API and its database. Flux
            deploys whatever lands on main, CrowdSec bans whoever knocks too hard, and Grafana Cloud tells me when
            something falls over.
          </p>
          <terminal-card
            command="kubectl get all -A"
            [output]="workloads"
            label="Terminal: some of the workloads running on the cluster"
          />
          <p class="mt-5 text-sm/5 text-muted">No public repo: it holds the keys to everything else.</p>
        </article>
      </div>
    </section>
  `,
})
export class ProjectsComponent {
  protected readonly workloads: TerminalLine[] = [
    { text: 'NAMESPACE     NAME                   READY', muted: true },
    { text: 'freek-mencke  freek-mencke-web       2/2' },
    { text: 'osrs-tracker  osrs-tracker-web       2/2' },
    { text: 'osrs-tracker  osrs-tracker-api       2/2' },
    { text: 'mongodb       mongodb                1/1' },
    { text: 'flux-system   kustomize-controller   1/1' },
    { text: 'traefik       traefik                1/1' },
    { text: 'crowdsec      crowdsec-lapi          1/1' },
    { text: '… and more', muted: true },
  ];
}
