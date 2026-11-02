export type PartKey =
  | 'main'
  | 'visitors'
  | 'grafana'
  | 'lambda'
  | 'queue'
  | 'flux'
  | 'web'
  | 'osrsweb'
  | 'api'
  | 'mongo'
  | 'traefik'
  | 'crowdsec'
  | 'ingester';

interface Workload {
  readonly ref: number;
  readonly name: string;
  readonly does: string;
  readonly pods: number;
}

export interface PartContent {
  readonly name: string;
  readonly note: string;
  readonly look?: 'flux' | 'live' | 'more';
  /** Only what runs on the node: it gets a number on the map and a row in "What runs on it" */
  readonly workload?: Workload;
}

interface ClusterPart extends PartContent {
  readonly key: PartKey;
}

/** Runs on the node but isn't drawn: no number, no row of its own, no lines */
export const OTHER_WORKLOADS: PartContent = {
  name: 'And a few more',
  note: 'Other workloads on the node',
  look: 'more',
};

export const CLUSTER_PARTS: readonly ClusterPart[] = [
  { key: 'main', name: 'git main', note: 'Each app’s main branch, on GitHub' },
  { key: 'visitors', name: 'Visitors', note: 'You, probably' },
  { key: 'grafana', name: 'Grafana Cloud', note: 'Tells me when something falls over' },
  { key: 'lambda', name: 'AWS Lambda', note: 'Collects player snapshots and counts' },
  { key: 'queue', name: 'Queue', note: 'What the Lambda jobs send' },
  {
    key: 'flux',
    name: 'Flux',
    note: 'Deploys the three apps',
    look: 'flux',
    workload: { ref: 1, name: 'kustomize-controller', does: 'Flux, deploying the three apps', pods: 1 },
  },
  {
    key: 'web',
    name: 'freek-mencke-web',
    note: 'This site',
    look: 'live',
    workload: { ref: 2, name: 'freek-mencke-web', does: 'This site', pods: 2 },
  },
  {
    key: 'osrsweb',
    name: 'osrs-tracker-web',
    note: 'OSRS Tracker’s website',
    look: 'live',
    workload: { ref: 3, name: 'osrs-tracker-web', does: 'OSRS Tracker’s website', pods: 2 },
  },
  {
    key: 'api',
    name: 'osrs-tracker-api',
    note: 'Its API',
    look: 'live',
    workload: { ref: 4, name: 'osrs-tracker-api', does: 'Its API', pods: 2 },
  },
  {
    key: 'mongo',
    name: 'MongoDB',
    note: 'Its database',
    workload: { ref: 5, name: 'mongodb', does: 'Its database', pods: 1 },
  },
  {
    key: 'traefik',
    name: 'Traefik',
    note: 'Takes the traffic in',
    workload: { ref: 6, name: 'traefik', does: 'Takes the traffic in', pods: 1 },
  },
  {
    key: 'crowdsec',
    name: 'CrowdSec',
    note: 'Bans whoever knocks too hard',
    workload: { ref: 7, name: 'crowdsec-lapi', does: 'Bans whoever knocks too hard', pods: 1 },
  },
  {
    key: 'ingester',
    name: 'osrs-tracker-ingester',
    note: 'Writes to MongoDB',
    workload: {
      ref: 8,
      name: 'osrs-tracker-ingester',
      does: 'Writes what the Lambda jobs collected to MongoDB',
      pods: 1,
    },
  },
];
