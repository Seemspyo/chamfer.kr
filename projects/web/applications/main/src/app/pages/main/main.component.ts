import { BreakpointObserver } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Banner } from '@chamfer/server';
import { SiteLayoutData } from 'common/api/configs/site-layout.config';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MainData } from './main.resolver';


@Component({
  selector: 'chamfer-main',
  templateUrl: 'main.component.html',
  styleUrls: [ 'main.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent implements OnInit, OnDestroy {

  public bannerList!: Banner[];
  public mediaConfig!: SiteLayoutData;

  public isBrowser: boolean;
  public isMobile!: boolean;

  private destroyed = new Subject<void>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    route: ActivatedRoute,
    private mediaObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    const { bannerList, mediaConfig } = route.snapshot.data.mainData as MainData;

    this.bannerList = bannerList;
    this.mediaConfig = mediaConfig;

    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;

    const query = '(max-width: 1028px)';

    this.mediaObserver.observe(query)
                      .pipe( takeUntil(this.destroyed) )
                      .subscribe(state => {
                        if (state.matches === this.isMobile) return;

                        this.isMobile = state.matches;
                        this.changeDetector.markForCheck();
                      });

    this.isMobile = this.mediaObserver.isMatched(query);
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

}
