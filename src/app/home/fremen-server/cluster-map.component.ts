import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatMap, exhaustMap, from, tap, timer } from 'rxjs';
import { Box, clusterEdges, MapEdge, MapMode } from './cluster-edges';
import { ClusterLegendComponent } from './cluster-legend.component';
import { ClusterPartComponent } from './cluster-part.component';
import { CLUSTER_PARTS, OTHER_WORKLOADS, PartKey } from './cluster-parts';
import { DeployPlateComponent } from './deploy-plate.component';
import { LAST_DEPLOY } from './last-deploy';

interface Drawing {
  readonly frame: Box;
  readonly edges: readonly MapEdge[];
  /** The lines a replay draws, in order */
  readonly route: readonly MapEdge[];
}

type ReplayStep = readonly [afterMs: number, run: () => void];

const REPLAY_ROUTE: readonly string[] = ['main-flux', 'flux-web'];

/**
 * The cluster as a drawing: hovering or focusing a box traces what it's connected to, and the button replays this
 * site's last deploy along the lines. The lines are drawn in the browser, from where the boxes ended up.
 */
@Component({
  selector: 'cluster-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClusterLegendComponent, ClusterPartComponent, DeployPlateComponent],
  templateUrl: './cluster-map.component.html',
  styleUrl: './cluster-map.component.css',
})
export class ClusterMapComponent {
  protected readonly otherWorkloads = OTHER_WORKLOADS;

  protected readonly drawing = signal<Drawing | null>(null);
  protected readonly pointed = signal<PartKey | null>(null);
  protected readonly focused = signal<PartKey | null>(null);
  /** Pointer and focus are tracked apart, so one leaving doesn't clear the other's trace: the pointer's box wins */
  protected readonly hovered = computed(() => this.pointed() ?? this.focused());

  protected readonly replaying = signal(false);
  protected readonly tracesDrawn = signal(0);
  protected readonly deployTextHidden = signal(false);
  protected readonly rollingPod = signal<number | null>(null);
  protected readonly status = signal('');
  private readonly played = signal<ReadonlySet<PartKey>>(new Set());

  protected readonly boxes = computed(() => {
    const hovered = this.hovered();
    const played = this.played();
    const edges = hovered ? (this.drawing()?.edges ?? []) : [];
    const connected = new Set(
      edges.filter(edge => edge.from === hovered || edge.to === hovered).flatMap(edge => [edge.from, edge.to]),
    );
    return CLUSTER_PARTS.map(part => {
      const trace = !hovered ? '' : part.key === hovered ? 'is-hot' : connected.has(part.key) ? 'is-lit' : 'is-dim';
      return { part, state: `${trace} ${played.has(part.key) ? 'is-played' : ''}` };
    });
  });

  /** exhaustMap is the guard: aria-disabled blocks nothing, and clicks during a replay are ignored here */
  protected readonly replay = rxMethod<void>(
    exhaustMap(() => from(this.replaySteps()).pipe(concatMap(([ms, run]) => timer(ms).pipe(tap(() => run()))))),
  );

  private readonly map = viewChild.required<ElementRef<HTMLElement>>('map');
  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const observer = new ResizeObserver(() => this.draw());
      observer.observe(this.map().nativeElement);
      // A late font can rewrap the boxes without changing the map's own size
      void document.fonts.ready.then(() => this.draw());
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected partOf(event: Event): PartKey | null {
    const box = (event.target as Element).closest<HTMLElement>('[data-part]');
    return (box?.dataset['part'] as PartKey | undefined) ?? null;
  }

  private draw(): void {
    const map = this.map().nativeElement;
    const origin = map.getBoundingClientRect();
    const boxOf = (element: Element): Box => {
      const rect = element.getBoundingClientRect();
      const [l, t, r, b] = [
        rect.left - origin.left,
        rect.top - origin.top,
        rect.right - origin.left,
        rect.bottom - origin.top,
      ];
      return { l, t, r, b, cx: (l + r) / 2, cy: (t + b) / 2 };
    };
    const parts = map.querySelectorAll<HTMLElement>('[data-part]');
    const boxes = Object.fromEntries([...parts].map(part => [part.dataset['part'], boxOf(part)]));
    const mode = getComputedStyle(map).getPropertyValue('--mode').trim() as MapMode;
    const frame = boxOf(this.frame().nativeElement);
    const edges = clusterEdges(mode, boxes as Record<PartKey, Box>, frame);
    this.drawing.set({ frame, edges, route: REPLAY_ROUTE.flatMap(id => edges.filter(edge => edge.id === id)) });
  }

  private replaySteps(): readonly ReplayStep[] {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return [[0, () => this.finishReplay()]];

    // A rolling update replaces one pod at a time, so the count stays 2/2 (freek-mencke-web.yaml)
    const rollPod = (pod: number): ReplayStep[] => [
      [120, () => this.rollingPod.set(pod)],
      [420, () => this.rollingPod.set(null)],
    ];
    return [
      [0, () => this.startReplay()],
      [250, () => this.tracesDrawn.set(1)],
      [600, () => this.play('flux')],
      [200, () => this.tracesDrawn.set(2)],
      [600, () => this.play('web')],
      ...rollPod(0),
      ...rollPod(1),
      [120, () => this.deployTextHidden.set(false)],
      [500, () => this.finishReplay()],
    ];
  }

  private startReplay(): void {
    this.replaying.set(true);
    this.played.set(new Set(['main']));
    this.tracesDrawn.set(0);
    this.deployTextHidden.set(true);
    this.status.set('Deploying: git main, then Flux, then freek-mencke-web.');
  }

  private play(part: PartKey): void {
    this.played.update(played => new Set(played).add(part));
  }

  private finishReplay(): void {
    this.replaying.set(false);
    this.played.set(new Set(['main', 'flux', 'web']));
    this.tracesDrawn.set(REPLAY_ROUTE.length);
    this.deployTextHidden.set(false);
    this.status.set(`Done. Last deploy of this site: ${LAST_DEPLOY.dateText}, ${LAST_DEPLOY.message}.`);
  }
}
