import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LAST_DEPLOY } from './last-deploy';

/** The last deploy beside Flux on the map, with the button that replays it */
@Component({
  selector: 'deploy-plate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './deploy-plate.component.css',
  template: `
    <div class="text">
      <p class="label">Last deploy of this site</p>
      <p class="line" [class.is-hidden]="textHidden()">
        <time class="date" [attr.datetime]="deploy.date">{{ deploy.dateText }}</time>
        {{ deploy.message }}
      </p>
    </div>
    <!-- Not disabled while it runs: that would drop focus to the page -->
    <button class="replay" type="button" [attr.aria-disabled]="replaying() || null" (click)="replay.emit()">
      {{ replaying() ? 'Replaying…' : 'Replay the last deploy' }}
    </button>
  `,
})
export class DeployPlateComponent {
  readonly replaying = input.required<boolean>();
  readonly textHidden = input.required<boolean>();
  readonly replay = output();

  protected readonly deploy = LAST_DEPLOY;
}
