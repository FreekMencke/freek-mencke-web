import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClusterMapComponent } from './cluster-map.component';

describe('ClusterMapComponent trace', () => {
  let map: HTMLElement;

  const box = (part: string): HTMLAnchorElement => map.querySelector<HTMLAnchorElement>(`[data-part="${part}"] a`)!;
  const trace = (): string | null => {
    TestBed.tick();
    return map.getAttribute('data-trace');
  };

  beforeEach(() => {
    // jsdom has neither; the map only needs them to draw its lines
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn() })),
    );
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: new Promise(vi.fn()) } });

    const fixture = TestBed.createComponent(ClusterMapComponent);
    document.body.appendChild(fixture.nativeElement);
    TestBed.tick();
    map = fixture.nativeElement.querySelector('.map');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('keeps the hovered box traced when focus leaves another box', () => {
    box('flux').focus();
    expect(trace()).toBe('flux');

    box('web').dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    expect(trace()).toBe('web');

    box('flux').blur();
    expect(trace()).toBe('web');
  });

  it('falls back to the focused box when the pointer leaves the map', () => {
    box('flux').focus();
    box('web').dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));

    map.dispatchEvent(new PointerEvent('pointerleave'));
    expect(trace()).toBe('flux');
  });

  it('clears the trace once neither pointer nor focus is on a box', () => {
    box('web').dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    map.dispatchEvent(new PointerEvent('pointerleave'));
    expect(trace()).toBeNull();

    box('flux').focus();
    box('flux').blur();
    expect(trace()).toBeNull();
  });
});
