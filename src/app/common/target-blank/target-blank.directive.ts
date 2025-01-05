import { Directive } from '@angular/core';

@Directive({
  selector: 'a[target="_blank"]',
  host: { rel: 'noopener' },
})
export class TargetBlankDirective {}
