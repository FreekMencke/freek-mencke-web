import { Component, model, ModelSignal } from '@angular/core';

@Component({
  selector: 'menu-button',
  template: `
    <button type="button" class="link-states w-6 h-6" (click)="menuCollapsed.set(!menuCollapsed())" aria-label="Menu">
      @if (!menuCollapsed()) {
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      } @else {
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      }
    </button>
  `,
  host: { class: 'flex' },
})
export class MenuButtonComponent {
  readonly menuCollapsed: ModelSignal<boolean> = model.required();
}
