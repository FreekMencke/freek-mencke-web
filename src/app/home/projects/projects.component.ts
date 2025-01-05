import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ImageCarouselComponent } from '../../common/image-carousel/image-carousel.component';
import { TargetBlankDirective } from '../../common/target-blank/target-blank.directive';

@Component({
  selector: 'projects',
  templateUrl: './projects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImageCarouselComponent, TargetBlankDirective],
})
export class ProjectsComponent {}
