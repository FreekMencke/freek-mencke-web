import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TargetBlankDirective } from '../../common/target-blank/target-blank.directive';

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TargetBlankDirective],
})
export class AboutComponent {}
