import { describe, expect, it } from 'vitest';
import { advanceSpring, makeSpring } from './spring';

function run(spring: ReturnType<typeof makeSpring>, seconds: number): number {
  let furthest = spring.value;
  for (let t = 0; t < seconds; t += 1 / 60) {
    advanceSpring(spring, 1 / 60);
    furthest = Math.max(furthest, spring.value);
  }
  return furthest;
}

describe('spring', () => {
  it('comes to rest exactly on its target and reports that it has stopped', () => {
    const spring = makeSpring(0, 200, 1, 0.05);
    spring.target = 100;

    run(spring, 3);

    expect(spring.value).toBe(100);
    expect(spring.velocity).toBe(0);
    expect(advanceSpring(spring, 1 / 60)).toBe(false);
  });

  it('overshoots below ratio 1 and not at ratio 1', () => {
    const soft = makeSpring(0, 200, 0.6, 0.05);
    const firm = makeSpring(0, 200, 1, 0.05);
    soft.target = 100;
    firm.target = 100;

    expect(run(soft, 3)).toBeGreaterThan(105);
    expect(run(firm, 3)).toBeLessThanOrEqual(100);
  });

  // What a flick relies on: the card carries on from the finger instead of starting again from a standstill
  it('keeps moving the way it was going when its target changes', () => {
    const spring = makeSpring(0, 200, 1, 0.05);
    spring.velocity = 1000;
    spring.target = -100;

    advanceSpring(spring, 1 / 60);

    expect(spring.value).toBeGreaterThan(5);
  });
});
