/**
 * A spring keeps its velocity when its target changes, so a flick carries on from the finger and a card can be caught
 * mid-flight. GSAP's eases can't do that and it has no spring; Motion can, but 24.6 kB is too heavy for these few lines.
 */
export interface Spring {
  value: number;
  target: number;
  velocity: number;
  stiffness: number;
  damping: number;
  /** How close counts as there, in its own units */
  readonly rest: number;
}

/** Ratio 1 arrives without overshooting; below 1 it overshoots a little, the lower the more */
export function tune(spring: Spring, stiffness: number, ratio: number): void {
  spring.stiffness = stiffness;
  spring.damping = 2 * ratio * Math.sqrt(stiffness);
}

export function makeSpring(value: number, stiffness: number, ratio: number, rest: number): Spring {
  const spring: Spring = { value, target: value, velocity: 0, stiffness: 0, damping: 0, rest };
  tune(spring, stiffness, ratio);
  return spring;
}

/** Moves it on by `seconds`, in steps short enough to stay stable. Returns whether it's still moving. */
export function advanceSpring(spring: Spring, seconds: number): boolean {
  const steps = Math.max(1, Math.ceil(seconds * 240));
  const step = seconds / steps;
  for (let i = 0; i < steps; i++) {
    spring.velocity += (-spring.stiffness * (spring.value - spring.target) - spring.damping * spring.velocity) * step;
    spring.value += spring.velocity * step;
  }
  if (Math.abs(spring.value - spring.target) < spring.rest && Math.abs(spring.velocity) < spring.rest * 10) {
    spring.value = spring.target;
    spring.velocity = 0;
    return false;
  }
  return true;
}
