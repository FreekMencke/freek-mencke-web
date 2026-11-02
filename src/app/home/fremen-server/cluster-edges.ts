import { PartKey } from './cluster-parts';

/** The map's three drawings, set by the width of its container in cluster-map.component.css */
export type MapMode = 'wide' | 'mid' | 'tall';

export interface Box {
  readonly l: number;
  readonly t: number;
  readonly r: number;
  readonly b: number;
  readonly cx: number;
  readonly cy: number;
}

export interface MapEdge {
  readonly id: string;
  readonly from: PartKey;
  /** null: to the boundary around the node */
  readonly to: PartKey | null;
  readonly kind: 'deploy' | 'traffic' | 'bans' | 'watch';
  readonly line: string;
  readonly head: string;
}

type Point = readonly [x: number, y: number];

const HEAD_LENGTH = 8;
const HEAD_HALF_WIDTH = 5;

const right = (from: Box, to: Box): Point[] => [
  [from.r, from.cy],
  [to.l, from.cy],
];
const left = (from: Box, to: Box): Point[] => [
  [from.l, from.cy],
  [to.r, from.cy],
];
const down = (from: Box, to: Box): Point[] => [
  [from.cx, from.b],
  [from.cx, to.t],
];
const up = (from: Box, to: Box): Point[] => [
  [from.cx, from.t],
  [from.cx, to.b],
];

function chevron([x0, y0]: Point, [x1, y1]: Point): string {
  const length = Math.hypot(x1 - x0, y1 - y0) || 1;
  const ux = (x1 - x0) / length;
  const uy = (y1 - y0) / length;
  const baseX = x1 - ux * HEAD_LENGTH;
  const baseY = y1 - uy * HEAD_LENGTH;
  const wingX = -uy * HEAD_HALF_WIDTH;
  const wingY = ux * HEAD_HALF_WIDTH;
  return `M${baseX + wingX} ${baseY + wingY}L${x1} ${y1}L${baseX - wingX} ${baseY - wingY}`;
}

/** Every line on the map, from the boxes' real positions so the text can wrap as it likes */
export function clusterEdges(mode: MapMode, b: Readonly<Record<PartKey, Box>>, frame: Box): MapEdge[] {
  const edges: MapEdge[] = [];
  const add = (from: PartKey, to: PartKey | null, kind: MapEdge['kind'], points: readonly Point[]): void => {
    edges.push({
      id: `${from}-${to ?? 'boundary'}`,
      from,
      to,
      kind,
      line: `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}`,
      head: chevron(points[points.length - 2], points[points.length - 1]),
    });
  };

  if (mode === 'tall') {
    add('main', 'flux', 'deploy', down(b.main, b.flux));
    add('visitors', 'traefik', 'traffic', down(b.visitors, b.traefik));
    add('grafana', null, 'watch', up(b.grafana, frame));
    add('crowdsec', 'traefik', 'bans', up(b.crowdsec, b.traefik));
    add('lambda', 'queue', 'traffic', up(b.lambda, b.queue));
    add('queue', 'ingester', 'traffic', up(b.queue, b.ingester));
    // Each app takes Flux's rail on its left and Traefik's on its right
    const leftRail = frame.l + 13;
    const rightRail = frame.r - 13;
    for (const app of ['web', 'osrsweb', 'api'] as const) {
      const flux = b.flux;
      const traefik = b.traefik;
      const { l, r, cy } = b[app];
      add('flux', app, 'deploy', [
        [flux.l, flux.cy],
        [leftRail, flux.cy],
        [leftRail, cy],
        [l, cy],
      ]);
      add('traefik', app, 'traffic', [
        [traefik.r, traefik.cy],
        [rightRail, traefik.cy],
        [rightRail, cy],
        [r, cy],
      ]);
    }
    add('osrsweb', 'api', 'traffic', down(b.osrsweb, b.api));
    add('api', 'mongo', 'traffic', down(b.api, b.mongo));
  } else {
    if (mode === 'wide') {
      add('main', 'flux', 'deploy', right(b.main, b.flux));
      add('visitors', 'traefik', 'traffic', right(b.visitors, b.traefik));
      add('grafana', null, 'watch', left(b.grafana, frame));
      add('lambda', 'queue', 'traffic', down(b.lambda, b.queue));
      add('queue', 'ingester', 'traffic', left(b.queue, b.ingester));
    } else {
      add('main', 'flux', 'deploy', down(b.main, b.flux));
      add('visitors', 'traefik', 'traffic', up(b.visitors, b.traefik));
      add('grafana', null, 'watch', up(b.grafana, frame));
      add('lambda', 'queue', 'traffic', right(b.lambda, b.queue));
      add('queue', 'ingester', 'traffic', up(b.queue, b.ingester));
    }
    // This site sits straight under Flux and straight over Traefik, so only OSRS Tracker's two apps need a bus
    const deployBus = (b.flux.b + b.web.t) / 2;
    const trafficBus = (b.web.b + b.traefik.t) / 2;
    add('flux', 'web', 'deploy', down(b.flux, b.web));
    add('traefik', 'web', 'traffic', up(b.traefik, b.web));
    for (const app of ['osrsweb', 'api'] as const) {
      const { cx, t, b: bottom } = b[app];
      add('flux', app, 'deploy', [
        [b.flux.cx, b.flux.b],
        [b.flux.cx, deployBus],
        [cx, deployBus],
        [cx, t],
      ]);
      add('traefik', app, 'traffic', [
        [b.traefik.cx, b.traefik.t],
        [b.traefik.cx, trafficBus],
        [cx, trafficBus],
        [cx, bottom],
      ]);
    }
    add('crowdsec', 'traefik', 'bans', left(b.crowdsec, b.traefik));
    add('osrsweb', 'api', 'traffic', right(b.osrsweb, b.api));
    add('api', 'mongo', 'traffic', right(b.api, b.mongo));
  }
  add('ingester', 'mongo', 'traffic', up(b.ingester, b.mongo));
  return edges;
}
