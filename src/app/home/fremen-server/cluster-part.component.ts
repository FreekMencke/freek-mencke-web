import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PartContent } from './cluster-parts';

/** One box on the map. What runs on the node links to its row in the table; the rest is only there to hover. */
@Component({
  selector: 'cluster-part',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  styleUrl: './cluster-part.component.css',
  template: `
    <ng-template #body>
      <span class="name">{{ part().name }}</span>
      <span class="note">{{ part().note }}</span>
    </ng-template>

    @if (part().workload; as workload) {
      <a class="part" [class]="classes()" [attr.href]="'#part-' + workload.ref">
        <span class="ref">{{ workload.ref }}</span>
        <ng-container [ngTemplateOutlet]="body" />
        <span class="pods" aria-hidden="true">
          @for (pod of pods(); track $index) {
            <i [class.is-rolling]="$index === rollingPod()"></i>
          }
          <b>{{ workload.pods }}/{{ workload.pods }}</b>
        </span>
        <span class="sr-only">, {{ workload.pods }} of {{ workload.pods }} ready, jumps to its row in the table</span>
      </a>
    } @else {
      <div class="part" [class]="classes()">
        <ng-container [ngTemplateOutlet]="body" />
      </div>
    }
  `,
})
export class ClusterPartComponent {
  readonly part = input.required<PartContent>();
  /** Its classes for hover and replay: is-hot, is-lit, is-dim, is-played */
  readonly state = input('');
  readonly rollingPod = input<number | null>(null);

  protected readonly classes = computed(() => {
    const look = this.part().look;
    return `${look ? `part--${look}` : ''} ${this.state()}`;
  });
  protected readonly pods = computed(() => Array.from({ length: this.part().workload?.pods ?? 0 }));
}
