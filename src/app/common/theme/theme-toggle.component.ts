import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeStore } from './theme-store';

/**
 * The round light/dark button, as on OSRS Tracker. Both icons render and CSS shows the one for the page's class, so the
 * pre-rendered page shows the right one before the store has read the theme.
 */
@Component({
  selector: 'theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex' },
  template: `
    <button
      type="button"
      class="flex size-11 items-center justify-center rounded-full border border-current/30 transition-colors hover:bg-current/12"
      aria-label="Dark mode"
      [attr.aria-pressed]="themeStore.dark()"
      (click)="themeStore.toggle()"
    >
      <svg
        class="size-4.5 dark:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
        />
      </svg>
      <svg
        class="hidden size-4.5 dark:block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  `,
})
export class ThemeToggleComponent {
  protected readonly themeStore = inject(ThemeStore);
}
