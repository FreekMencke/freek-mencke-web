import { Component, InputSignal, OutputEmitterRef, WritableSignal, input, linkedSignal, output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'menu-button',
  template: `
    <button type="button" class="link-states w-6 h-6" (click)="toggleMenuCollapse()" aria-label="Menu">
      @if (!menuCollapsed) {
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
  readonly menuCollapsedState: WritableSignal<boolean> = linkedSignal(() => this.menuCollapsed());

  readonly menuCollapsed: InputSignal<boolean> = input.required();
  readonly menuCollapsedChange: OutputEmitterRef<boolean> = output<boolean>();

  toggleMenuCollapse(): void {
    this.menuCollapsedState.set(!this.menuCollapsedState());
    this.menuCollapsedChange.emit(this.menuCollapsedState());
  }
}
