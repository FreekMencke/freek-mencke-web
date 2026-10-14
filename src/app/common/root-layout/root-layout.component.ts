import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeToggleComponent } from '@app/common/theme/theme-toggle.component';
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
    .bar:not(.is-scrolled) a:hover {
      color: var(--color-field-accent);
    }
    .bar:not(.is-scrolled) :focus-visible {
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
      class="bar sticky top-0 z-10 flex h-bar-phone items-center justify-between gap-4 px-page text-on-field sm:h-bar"
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
}
