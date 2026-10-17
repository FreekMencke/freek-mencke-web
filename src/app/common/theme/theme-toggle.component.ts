import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideMoon, LucideSun } from '@lucide/angular';
import { ThemeStore } from './theme-store';

/**
 * The round light/dark button, as on OSRS Tracker. Both icons render and CSS shows the one for the page's class, so the
 * pre-rendered page shows the right one before the store has read the theme.
 */
@Component({
  selector: 'theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideMoon, LucideSun],
  host: { class: 'flex' },
  template: `
    <button
      type="button"
      class="flex size-11 items-center justify-center rounded-full border border-current/30 transition-colors hover:bg-current/12"
      aria-label="Dark mode"
      [attr.aria-pressed]="themeStore.dark()"
      (click)="themeStore.toggle()"
    >
      <svg lucideSun class="size-4.5 dark:hidden" />
      <svg lucideMoon class="hidden size-4.5 dark:block" />
    </button>
  `,
})
export class ThemeToggleComponent {
  protected readonly themeStore = inject(ThemeStore);
}
