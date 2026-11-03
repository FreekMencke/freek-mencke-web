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
        background-color var(--duration-fade),
        color var(--duration-fade),
        box-shadow var(--duration-fade);
    }
    /* Glass, about as thin as AA allows. Thinner, the focus ring drops below 3:1 over the mid-page field in light, and
       the text below 4.5:1 over the light screenshots in dark. A wider blur smears bright things into a glow, and
       without the hairline whatever slides under the bar looks cut off. */
    .bar.is-scrolled {
      background-color: color-mix(in oklch, var(--color-ground) 75%, transparent);
      backdrop-filter: blur(8px);
      color: var(--color-ink);
      box-shadow: 0 1px 0 var(--color-line);
    }
    /* Dark: the field's green carries on. The dark ground over the light screenshots reads as a black band. */
    :host-context(.dark) .bar.is-scrolled {
      background-color: color-mix(in oklch, var(--color-field) 72%, transparent);
      color: var(--color-on-field);
      box-shadow: 0 1px 0 var(--color-field-line);
    }
    /* Forced colours drop the shadow and paint every background Canvas, in both themes: a line instead, so the bar
       stays apart from the page under it. Always there, so nothing shifts when the bar turns solid. */
    @media (forced-colors: active) {
      .bar {
        border-bottom: 1px solid CanvasText;
      }
    }
    .mark {
      opacity: 0;
      visibility: hidden;
      transition:
        opacity var(--duration-fade),
        visibility var(--duration-fade);
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
    /* The bar's breakpoints are its own width in rem, not the screen's: a container query's rem follows the root font
       size, so larger text moves them too. At the default size they match the screen's (xs, with the 16px gutters). */
    .bar {
      container: bar / inline-size;
    }
    /* Stacked below xs, a small copy of the hero's wordmark on phones: its tracking and line height, FREEK regular and
       as wide as MENCKE. At 1.34em, not the hero's 1.36em: at 16px glyphs snap to whole pixels, and 1.36em measured
       about 3px wider than MENCKE in Chromium at 320px, 1.34em about 1px narrower. */
    @container bar (width < 22rem) {
      .mark {
        letter-spacing: 0.08em;
        line-height: 0.98;
      }
      .mark .first,
      .mark .last {
        display: block;
      }
      .mark .first {
        font-size: 1.34em;
        font-weight: 400;
      }
    }
    /* Too narrow even stacked (about 200% text on a phone): the links drop to a row of their own under the wordmark and
       the toggle. 17rem is the stacked row's width; the bar tokens' bar-wrap grows the bar by the second row. */
    @container bar (width < 17rem) {
      .row {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: 3.5rem 1.75rem;
        row-gap: 0;
      }
      .mark {
        justify-self: start;
      }
      .links {
        display: contents;
      }
      nav {
        grid-row: 2;
        grid-column: 1 / -1;
        align-self: start;
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
      class="bar sticky top-0 z-10 flex min-h-bar-phone flex-col justify-center px-page sa-t text-on-field sm:min-h-bar"
      [class.is-scrolled]="!barStore.overField()"
    >
      <div class="row flex items-center justify-between gap-4">
        <!-- Hidden, the wordmark still takes its width: it stacks on narrow bars, or it would push the toggle off -->
        <a
          class="mark text-base tracking-widest whitespace-nowrap uppercase hover:text-accent"
          routerLink="/"
          fragment="top"
          aria-label="Freek Mencke, back to top"
        >
          <!-- A space shrunk to nothing (.gap) makes the text "Freek Mencke", as the label starts (WCAG 2.5.3) -->
          <span class="first font-semibold">Freek</span><span class="gap">&ngsp;</span
          ><span class="last font-thin">Mencke</span>
        </a>

        <div class="links flex items-center gap-6">
          <nav class="flex gap-6 text-sm/5 font-medium" aria-label="Sections">
            <a class="hover:text-accent" routerLink="/" fragment="projects">Projects</a>
            <a class="hover:text-accent" routerLink="/" fragment="cluster">Cluster</a>
          </nav>
          <theme-toggle />
        </div>
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
