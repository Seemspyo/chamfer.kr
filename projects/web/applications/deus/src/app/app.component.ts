import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { ProgressInterceptor, ProgressState } from 'common/progress-interceptor';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
  selector: 'deus',
  template: `
    <mat-progress-bar
      *ngIf="progressState.value"
      [mode]="progressState.mode || 'indeterminate'"
      [value]="progressState.progress"
      class="progress-bar"
      color="primary"
    ></mat-progress-bar>
    <router-outlet></router-outlet>
  `,
  styleUrls: [ 'app.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'deus'
  }
})
export class AppComponent implements OnInit, OnDestroy {

  public progressState!: ProgressState;
  private destroyed = new Subject<void>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private progressInterceptor: ProgressInterceptor
  ) { }

  ngOnInit() {
    this.progressInterceptor.progress.pipe( takeUntil(this.destroyed) )
    .subscribe(state => {
      this.progressState = state;
      this.changeDetector.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

}
