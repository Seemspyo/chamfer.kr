import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  ActivationEnd,
  Router
} from '@angular/router';
import { AuthAPI } from 'common/api/auth.api';
import { parseGQLError } from 'common/api/errors';
import { SlideTab } from 'common/slide-tab';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserDialog } from './dialogs/user/user.dialog';


export interface AbstractNavigationData {
  id: string;
  iconText?: string;
  type: string;
  label: string;
  disabled?: boolean;
}

export interface GroupNavigationData extends AbstractNavigationData {
  type: 'group';
  children: NavigationData[];
}

export interface RouterNavigationData extends AbstractNavigationData {
  type: 'routerLink';
  link: string;
}

export interface OuterNavigationData extends AbstractNavigationData {
  type: 'outerLink';
  href: string;
  target?: string;
  rel?: string;
}

export interface ButtonNavigationData extends AbstractNavigationData {
  type: 'button';
  action: () => void;
}

export type NavigationData = GroupNavigationData|RouterNavigationData|OuterNavigationData|ButtonNavigationData;

const tabItemAnimation = trigger('tabItemAnimation', [

  transition('* => *', [

    query(':enter', [
      style({ 'transform': 'translateX(-50px)', 'opacity': '0' }),
      stagger(100, [
        animate('0.5s ease', style({ 'transform': 'translateX(0px)', 'opacity': '1' }))
      ])
    ], { optional: true })

  ])

]);

@Component({
  selector: 'deus-main',
  templateUrl: 'main.component.html',
  styleUrls: [ 'main.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'main'
  },
  animations: [
    tabItemAnimation
  ]
})
export class MainComponent implements OnInit, AfterViewInit, OnDestroy {

  public navDatas: NavigationData[] = [
    {
      id: 'site',
      type: 'group',
      iconText: 'home',
      label: '사이트 관리',
      children: [
        {
          id: 'dashboard',
          type: 'routerLink',
          iconText: 'dashboard',
          label: 'Dashboard',
          link: '/'
        },
        {
          id: 'banner',
          type: 'routerLink',
          iconText: 'crop_original',
          label: '배너 관리',
          link: '/banner'
        },
        {
          id: 'site-info',
          type: 'routerLink',
          iconText: 'contact_mail',
          label: '사이트 정보 관리',
          link: '/site-info'
        },
        {
          id: 'site-main',
          type: 'routerLink',
          iconText: 'pivot_table_chart',
          label: '메인 레이아웃 관리',
          link: '/site-layout'
        }
      ]
    },
    {
      id: 'user',
      type: 'routerLink',
      iconText: 'manage_accounts',
      label: '사용자 관리',
      link: '/users'
    },
    {
      id: 'product',
      type: 'routerLink',
      iconText: 'store',
      label: '상품 관리',
      link: '/products'
    },
    {
      id: 'article',
      type: 'group',
      iconText: 'feed',
      label: '게시글 관리',
      children: [
        {
          id: 'article-write',
          type: 'routerLink',
          iconText: 'create',
          label: '글쓰기',
          link: '/articles/write'
        },
        {
          id: 'article-notice',
          type: 'routerLink',
          iconText: 'notifications',
          label: '공지사항 관리',
          link: '/articles/notice'
        }
      ]
    }
  ]

  public navModel: NavigationData[] = this.navDatas;
  public navDepth = 0;
  public navPath: string[] = []

  @ViewChild(SlideTab)
  slideTab?: SlideTab;

  get _user() {

    return this.authAPI.me!;
  }

  _slideTabInitial?: number;

  private destroyed = new Subject<void>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private authAPI: AuthAPI,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.detectCurrentNavigation(this.route.snapshot);
  }

  ngAfterViewInit() {
    this.router.events.pipe(
      takeUntil(this.destroyed)
    ).subscribe(event => {
      if (event instanceof ActivationEnd) {
        this.detectCurrentNavigation(event.snapshot);
      }
    });

    this.authAPI.authState.pipe(
      takeUntil(this.destroyed)
    ).subscribe(state => {
      if (state === false) {
        this.router.navigateByUrl('/auth/sign');
      }
    });
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public setNavModel(datas: NavigationData[], depth: number) {
    this.navModel = datas;
    this.navDepth = Math.max(0, depth);
    this.changeDetector.markForCheck();
  }

  async _signOut() {
    try {
      await this.authAPI.signOut().toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
    }
  }

  _openMyDialog() {
    this.dialog.open(UserDialog, { data: { user: this._user } });
  }

  _selectGroup(nav: GroupNavigationData) {
    if (!nav.children.length) return;

    const path = this.navPath.slice(0, this.navPath.length - 1).concat([ nav.id, nav.children[0].id ]);

    this._setNavigationByPath(path);
  }

  _setNavigationByPath(path: string[]) {
    let
    navs = this.navDatas,
    navIndex = -1,
    depth = 0;

    for (const id of path) {
      const _navIndex = navs.findIndex(nav => nav.id === id);

      if (_navIndex < 0) break;

      navIndex = _navIndex;
      const nav = navs[navIndex];

      if (nav.type !== 'group') break;

      navs = nav.children;
      depth++;
    }

    this.navPath = path;

    if (navIndex >= 0) {
      this.setNavModel(navs, depth);

      if (this.slideTab) {
        this.slideTab.setIndex(navIndex);
      } else {
        this._slideTabInitial = navIndex;
      }
    } else {
      this.setNavModel(this.navDatas, depth);
    }
  }

  private extractPathFrom(snapshot: ActivatedRouteSnapshot, path: string[] = []) {
    let { id } = snapshot.data;

    if (id) {
      if (typeof id === 'string') id = [ id ]

      path.push(...id);
    }

    for (const child of snapshot.children) this.extractPathFrom(child, path);

    return path;
  }

  private detectCurrentNavigation(snapshot: ActivatedRouteSnapshot) {
    const path = this.extractPathFrom(snapshot);

    this._setNavigationByPath(path);
  }

}
