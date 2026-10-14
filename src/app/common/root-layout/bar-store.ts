import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

class BarState {
  /** Over the hero's green field the bar is see-through; below it, a blurred bar on the ground with the wordmark */
  overField = true;
}

/** The hero reports whether it's still under the bar; the bar in the root layout reads it */
export const BarStore = signalStore(
  { providedIn: 'root' },
  withState(new BarState()),
  withMethods(store => ({
    setOverField(overField: boolean): void {
      patchState(store, { overField });
    },
  })),
);
