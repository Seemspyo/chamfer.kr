import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
  selector: 'page-not-found',
  template: `
    <h1>NOT FOUND</h1>
    <p>Sorry, requested path <b>{{ path }}</b> does not exists.</p>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      margin: auto 0;
    }

    h1 {
      color: var(--color-chamfer-green);
      font-size: 24px;
      font-weight: 600;
    }

    p {
      color: #333;
      font-size: 14px;
      font-weight: 300;
    }

    b {
      color: var(--color-chamfer-green);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageNotFound implements OnInit, OnDestroy {

  public path: string;

  private destroyed = new Subject<void>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private location: Location,
    private router: Router
  ) {
    this.path = location.path();
  }

  ngOnInit() {
    this.router.events.pipe( takeUntil(this.destroyed) )
    .subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.path = this.location.path();
        this.changeDetector.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

}
