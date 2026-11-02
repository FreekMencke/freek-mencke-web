import { ChangeDetectionStrategy, Component } from '@angular/core';

/** What the map's lines mean, as samples of the lines themselves rather than icons */
@Component({
  selector: 'cluster-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './cluster-legend.component.css',
  template: `
    <ul>
      <li>
        <svg viewBox="0 0 36 12" aria-hidden="true"><path class="is-deploy" d="M0 6h36" stroke-dasharray="6 5" /></svg>
        Deploys
      </li>
      <li>
        <svg viewBox="0 0 36 12" aria-hidden="true">
          <path d="M0 6h35M29 1l6 5-6 5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Traffic
      </li>
      <li>
        <svg viewBox="0 0 36 12" aria-hidden="true"><path d="M0 6h36" stroke-dasharray="3 5" /></svg>
        Bans
      </li>
      <li>
        <svg viewBox="0 0 36 12" aria-hidden="true">
          <path d="M1 6h34" stroke-dasharray="0.1 6" stroke-linecap="round" stroke-width="2" />
        </svg>
        Watches
      </li>
    </ul>
  `,
})
export class ClusterLegendComponent {}
