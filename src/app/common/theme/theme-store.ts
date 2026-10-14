import { afterNextRender, DOCUMENT, inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

/** The visitor's choice, read by the inline script in index.html before the first paint */
export const THEME_STORAGE_KEY = 'theme';

/** The page's ground per theme (base.css), for the browser's UI around the page */
const THEME_COLOR = { light: '#f4f5f7', dark: '#0b1613' };

class ThemeState {
  /** Light while pre-rendering; the browser reads the class index.html's script set */
  dark = false;
}

export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState(new ThemeState()),
  withMethods(store => {
    const document = inject(DOCUMENT);

    return {
      _syncWithPage(): void {
        patchState(store, { dark: document.documentElement.classList.contains('dark') });
      },

      toggle(): void {
        const dark = !store.dark();
        patchState(store, { dark });

        localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', dark);
        document
          .querySelector('meta[name="theme-color"]')
          ?.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light);
      },
    };
  }),
  withHooks({
    onInit(store) {
      afterNextRender(() => store._syncWithPage());
    },
  }),
);
