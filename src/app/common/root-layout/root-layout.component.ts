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
    /* A word break between the names that takes no room: an sr-only space doesn't count as the visible label */
    .mark .gap {
      font-size: 0;
      letter-spacing: 0;
    }
    .is-scrolled .mark {
      opacity: 1;
      visibility: visible;
    }
    /* Stacked below xs, a small copy of the hero's wordmark on phones: its tracking and line height, FREEK regular and
       as wide as MENCKE */
    @media (width < 24rem) {
      .mark {
        letter-spacing: 0.08em;
        line-height: 0.98;
      }
      .mark .first {
        font-size: 1.34em;
        font-weight: 400;
      }
    }
    /* On green (over the hero, and the solid bar in dark) hovers and focus rings take the field's accent. As a token,
       so it reaches the theme toggle's ring too: a selector here stops at its component boundary. */
    .bar:not(.is-scrolled),
    :host-context(.dark) .bar {
      --color-accent: var(--color-field-accent);
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
      <!-- Hidden, the wordmark still takes its width: below xs it stacks, or it would push the toggle off the screen -->
      <a
        class="mark text-base tracking-widest whitespace-nowrap uppercase hover:text-accent"
        routerLink="/"
        fragment="top"
        aria-label="Freek Mencke, back to top"
      >
        <!-- A space shrunk to nothing (.gap) makes the text "Freek Mencke", as the label starts (WCAG 2.5.3) -->
        <span class="first font-semibold max-xs:block">Freek</span><span class="gap">&ngsp;</span
        ><span class="font-thin max-xs:block">Mencke</span>
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
