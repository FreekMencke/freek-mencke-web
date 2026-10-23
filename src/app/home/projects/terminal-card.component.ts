import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface TerminalLine {
  text: string;
  /** A table header or a note, not output */
  muted?: boolean;
}

/** A green terminal with a command and its output, for the projects without screenshots */
@Component({
  selector: 'terminal-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block mt-6' },
  // The lines are data, not projected content: a template collapses the spaces that line up a table, except in <pre>.
  // tabindex: on the narrowest phones it scrolls sideways, and Safari doesn't let the keyboard reach a scroller itself
  template: `
    <pre
      class="overflow-x-auto rounded-xl bg-field p-4 font-mono text-xs/5 text-on-field sm:px-6 sm:py-5 sm:text-sm/5.5"
      tabindex="0"
      role="img"
      [attr.aria-label]="label()"
    ><span class="text-field-accent">$</span> {{ command() }}@for (line of output(); track $index) {<br /><span [class.text-field-muted]="line.muted">{{ line.text }}</span>}</pre>
  `,
})
export class TerminalCardComponent {
  readonly command = input.required<string>();
  readonly output = input<TerminalLine[]>([]);
  /** What the terminal shows, for screen readers: a table of spaces reads badly */
  readonly label = input.required<string>();
}
