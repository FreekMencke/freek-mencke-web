import { describe, expect, it } from 'vitest';
import { Box, clusterEdges, MapMode } from './cluster-edges';
import { CLUSTER_PARTS, PartKey } from './cluster-parts';

const box: Box = { l: 0, t: 0, r: 10, b: 10, cx: 5, cy: 5 };
const boxes = Object.fromEntries(CLUSTER_PARTS.map(part => [part.key, box])) as Record<PartKey, Box>;

describe('clusterEdges', () => {
  // Each width draws its lines separately, and the map states facts: no layout may lose or invent a connection
  it.each<MapMode>(['wide', 'mid', 'tall'])('draws the same connections in the %s drawing', mode => {
    const connections = clusterEdges(mode, boxes, box)
      .map(edge => `${edge.id} ${edge.kind}`)
      .sort();

    expect(connections).toEqual([
      'api-mongo traffic',
      'crowdsec-traefik bans',
      'flux-api deploy',
      'flux-osrsweb deploy',
      'flux-web deploy',
      'grafana-boundary watch',
      'ingester-mongo traffic',
      'lambda-queue traffic',
      'main-flux deploy',
      'osrsweb-api traffic',
      'queue-ingester traffic',
      'traefik-api traffic',
      'traefik-osrsweb traffic',
      'traefik-web traffic',
      'visitors-traefik traffic',
    ]);
  });
});
