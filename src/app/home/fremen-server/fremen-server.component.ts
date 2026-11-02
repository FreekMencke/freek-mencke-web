import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ClusterMapComponent } from './cluster-map.component';
import { CLUSTER_PARTS } from './cluster-parts';

/** The cluster behind everything: the map on a green field, and what runs on it on a card crossing the field's edge */
@Component({
  selector: 'fremen-server',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClusterMapComponent],
  styleUrl: './fremen-server.component.css',
  host: { class: 'block' },
  template: `
    <section id="cluster" class="mt-section" aria-labelledby="cluster-title">
      <div class="field pt-section-sm pb-40">
        <div class="mx-auto max-w-page px-page">
          <h2 id="cluster-title" class="text-center text-headline font-light text-balance">
            It all runs on my cluster.
          </h2>
          <p class="mx-auto mt-6 max-w-225 text-center text-lead font-light text-balance">
            My own Kubernetes cluster, on a VPS. It runs this site, OSRS Tracker, its API and its database.
          </p>
          <cluster-map class="mt-12 sm:mt-16" />
        </div>
      </div>

      <div class="mx-auto -mt-24 max-w-page px-page">
        <div class="card">
          <h3 class="text-subhead font-medium">What runs on it</h3>
          <table class="workloads">
            <thead>
              <tr>
                <th scope="col" class="ref"><span class="sr-only">Number on the map</span></th>
                <th scope="col">Workload</th>
                <th scope="col" class="does">What it does</th>
                <th scope="col" class="ready">Ready</th>
              </tr>
            </thead>
            <tbody>
              @for (workload of workloads; track workload.ref) {
                <tr>
                  <td class="ref">
                    <span class="anchor" [id]="'part-' + workload.name"></span>
                    <span class="badge">{{ workload.ref }}</span>
                  </td>
                  <th scope="row">{{ workload.name }}</th>
                  <td class="does">{{ workload.does }}</td>
                  <td class="ready">
                    <span class="dots" aria-hidden="true">
                      @for (dot of workload.dots; track $index) {
                        <i></i>
                      }
                    </span>
                    {{ workload.pods }}/{{ workload.pods }}
                  </td>
                </tr>
              }
              <tr class="rest">
                <td colspan="4">And a few more.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
})
export class FremenServerComponent {
  protected readonly workloads = CLUSTER_PARTS.flatMap(({ workload }) =>
    workload ? [{ ...workload, dots: Array.from({ length: workload.pods }) }] : [],
  );
}
