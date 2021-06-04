import {
  animate,
  group,
  query,
  style,
  transition,
  trigger
} from '@angular/animations';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Injectable,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  SecurityContext,
  ViewChild
} from '@angular/core';
import { DomSanitizer, Meta, Title } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  ActivationEnd,
  Data,
  Router,
  RouterOutlet
} from '@angular/router';
import { ConfigAPI } from 'common/api/config.api';
import { SiteInfo, siteInfoId } from 'common/api/configs/site-info.config';
import { fromEvent, merge, Subject } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import remark from 'remark';
import toHTML from 'remark-html';
import linkAttributes from 'remark-external-links';
import { SwiperComponent } from 'swiper/angular';


interface RouterLinkData {
  id: string;
  link: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class AppData {

  public siteInfo!: SiteInfo;

  constructor(
    private configAPI: ConfigAPI
  ) { }

  async init() {
    this.siteInfo = await this.configAPI.getConfig<SiteInfo>(siteInfoId).pipe(
      map(data => data || { footerText: 'Copyright CHAMFER. ALL RIGHTS RESERVED.' })
    ).toPromise();
  }

}

const
navActiveAnimation = trigger('navActiveAnimation', [

  transition(':enter', [
    style({ transform: 'scaleX(0)' }),
    animate('0.3s ease', style({ transform: 'scaleX(1)' }))
  ])

]),
routeAnimation = trigger('routeAnimation', [

  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':leave', [
      style({ opacity: '1', position: 'absolute', top: '0', left: '0', width: '100%' })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: '0', zIndex: '3', position: 'relative' })
    ], { optional: true }),
    group([
      query(':enter', [
        animate('0.3s', style({ opacity: '1' }))
      ], { optional: true }),
      query(':leave', [
        animate('0.2s', style({ opacity: '0' }))
      ], { optional: true })
    ])
  ])

]);

@Component({
  selector: 'chamfer',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    navActiveAnimation,
    routeAnimation
  ]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {

  public linkDatas: RouterLinkData[] = [
    { id: 'about', link: '/about', label: 'ABOUT' },
    { id: 'product', link: '/products', label: 'PRODUCT' },
    { id: 'photo-book', link: '/photo-book', label: 'PHOTO BOOK' },
    { id: 'notice', link: '/notice', label: 'NOTICE' }
  ]
  public currentNavId!: string;

  public siteInfo: SiteInfo;

  @ViewChild('header')
  headerElRef!: ElementRef<HTMLElement>;

  @ViewChild(SwiperComponent)
  swiperComponentRef!: SwiperComponent;

  public onTop = true;
  public headerShouldHide = false;
  private prevScrollTop = 0;

  private isBrowser: boolean;
  private isFirstNavigation = true;

  private destroyed = new Subject<void>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private router: Router,
    private title: Title,
    private meta: Meta,
    appData: AppData,
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(DOCUMENT) private doc: Document,
    sanitizer: DomSanitizer
  ) {
    this.siteInfo = appData.siteInfo;
    this.isBrowser = isPlatformBrowser(platformId);

    {
      const markdown2HTML = remark()
                              .use(linkAttributes, { target: '_blank' })
                              .use(toHTML);

      this.siteInfo.footerText = sanitizer.sanitize(SecurityContext.HTML, markdown2HTML.processSync(this.siteInfo.footerText).toString('utf-8')) ?? '';
    }
  }

  ngOnInit() {
    this.router.events.pipe( takeUntil(this.destroyed) )
    .subscribe(event => {
      if (event instanceof ActivationEnd) {
        const data = this.flatData(event.snapshot);

        this.detectCurrentNavWith(data);
        this.setSubtitleWith(data);

        if (this.isFirstNavigation) {
          this.isFirstNavigation = false;
        }
      }
    });
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    this.detectScroll();

    merge(
      fromEvent(window, 'scroll'),
      fromEvent(this.doc.scrollingElement || this.doc.body, 'scroll')
    )
    .pipe(
      takeUntil(this.destroyed),
      debounceTime(100)
    )
    .subscribe(() => this.detectScroll());
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public getRouteState(outlet: RouterOutlet) {

    return outlet.isActivated ? outlet.activatedRoute : '';
  }

  private detectCurrentNavWith(data: Data) {
    const id = data.navId;

    if (id === this.currentNavId) return;

    this.currentNavId = id;
    // calling swiper method brokes route animations
    if (this.isBrowser) {
      setTimeout(() => {
        this.swiperComponentRef.swiperRef.slideTo(this.linkDatas.findIndex(data => data.id === this.currentNavId), this.isFirstNavigation ? 0 : void 0);
      });
    }
    this.changeDetector.markForCheck();
  }

  private setSubtitleWith(data: Data) {
    const title = (data.title ? `${ data.title } - ` : '') + 'CHAMFER' ;
    
    this.title.setTitle(title);
    this.meta.addTag({ property: 'og:title', content: title }, true);
  }

  private flatData(snapshot: ActivatedRouteSnapshot, data: Data = {}) {
    data = { ...snapshot.data }

    for (const child of snapshot.children) {
      data = { ...this.flatData(child, data) }
    }

    return data;
  }

  private detectScroll() {
    const
    scrollTop = window.pageYOffset || this.doc.scrollingElement?.scrollTop || 0,
    isOnTop = scrollTop === 0,
    headerShouldHide = this.headerElRef.nativeElement.offsetHeight < scrollTop && this.prevScrollTop < scrollTop;
    
    if (this.onTop !== isOnTop || this.headerShouldHide !== headerShouldHide) {
      this.onTop = isOnTop;
      this.headerShouldHide = headerShouldHide;

      this.changeDetector.markForCheck();
    }

    this.prevScrollTop = scrollTop;
  }

}
