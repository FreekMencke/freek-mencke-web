import { ViewportScroller } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeToggleComponent } from '../theme/theme-toggle.component';
import { BarStore } from './bar-store';

@Component({
  selector: 'root-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, ThemeToggleComponent],
  styles: `
    .bar {
      transition:
        background-color 0.25s,
        color 0.25s,
        box-shadow 0.25s;
    }
    .bar.is-scrolled {
      background-color: color-mix(in oklch, var(--color-ground) 86%, transparent);
      backdrop-filter: blur(12px);
      color: var(--color-ink);
      box-shadow: 0 1px 0 var(--color-line);
    }
    /* Dark: the field's green carries on. The dark ground over the light screenshots reads as a black band. */
    :host-context(.dark) .bar.is-scrolled {
      background-color: color-mix(in oklch, var(--color-field) 92%, transparent);
      color: var(--color-on-field);
      box-shadow: none;
    }
    .mark {
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.25s,
        visibility 0.25s;
    }
    .is-scrolled .mark {
      opacity: 1;
      visibility: visible;
    }
    .bar:not(.is-scrolled) a:hover,
    :host-context(.dark) .bar a:hover {
      color: var(--color-field-accent);
    }
    .bar:not(.is-scrolled) :focus-visible,
    :host-context(.dark) .bar :focus-visible {
      outline-color: var(--color-field-accent);
    }
    @media (prefers-reduced-motion: reduce) {
      .bar,
      .mark {
        transition: none;
      }
    }
  `,
  template: `
    <div
      #bar
      class="bar sticky top-0 z-10 flex h-bar-phone items-center justify-between gap-4 px-page sa-t text-on-field sm:h-bar"
      [class.is-scrolled]="!barStore.overField()"
    >
      <a
        class="mark text-base tracking-widest whitespace-nowrap uppercase hover:text-accent"
        routerLink="/"
        fragment="top"
        aria-label="Freek Mencke, back to top"
      >
        <span class="font-semibold">Freek</span><span class="font-thin">Mencke</span>
      </a>

      <div class="flex items-center gap-6">
        <nav class="flex gap-6 text-sm/5 font-medium" aria-label="Sections">
          <a class="hover:text-accent" routerLink="/" fragment="projects">Projects</a>
          <a class="hover:text-accent" routerLink="/" fragment="about">About</a>
        </nav>
        <theme-toggle />
      </div>
    </div>

    <router-outlet />
  `,
})
export default class RootLayoutComponent {
  protected readonly barStore = inject(BarStore);
  private readonly bar = viewChild.required<ElementRef<HTMLElement>>('bar');

  constructor() {
    const scroller = inject(ViewportScroller);

    afterNextRender(() => {
      // The router's anchor scrolling ignores scroll-padding: drop its targets by the top safe area the bar grows by
      // (sa-t). The sections' own top padding clears the rest of the bar.
      scroller.setOffset(() => [0, parseFloat(getComputedStyle(this.bar().nativeElement).paddingTop)]);
    });
  }
}
