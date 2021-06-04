import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { Product } from '@chamfer/server';
import { ProductAPI } from 'common/api/product.api';
import { fromEvent, merge, Subject } from 'rxjs';
import { catchError, debounceTime, exhaustMap, map, takeUntil } from 'rxjs/operators';


const
itemAnimation = trigger('itemAnimation', [

  transition('* => *', [

    query(':enter', [
      style({ opacity: '0', transform: 'translateY(-50px)' }),
      stagger(150, [
        animate('0.5s ease', style({ opacity: '1', transform: 'translateY(0px)' }))
      ])
    ], { optional: true })

  ])

]),
dummyAnimation = trigger('dummyAnimation', [

  transition(':enter', [
    style({ opacity: '0' }),
    animate('0.5s', style({ opacity: '1' }))
  ]),

  transition(':leave', [
    style({ opacity: '1' }),
    animate('0.3s', style({ opacity: '0' }))
  ])

]);

@Component({
  selector: 'chamfer-product',
  templateUrl: 'product.component.html',
  styleUrls: [ 'product.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    itemAnimation,
    dummyAnimation
  ]
})
export class ProductComponent implements AfterViewInit, OnDestroy {

  public productListModel: Product[] = []
  public fetching = true;

  private refreshTrigger = new Subject<void>();
  private pagingEnd = new Subject<void>();

  @ViewChild('listContainer')
  listContainerElRef!: ElementRef<HTMLElement>;

  private pageIndex = 0;
  private pageSize = 12;
  private total!: number;

  private isBrowser: boolean;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private productAPI: ProductAPI,
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(DOCUMENT) private doc: Document
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit() {
    merge(
      this.refreshTrigger,
      ...(this.isBrowser ? [
        fromEvent(window, 'scroll'),
        fromEvent(this.doc.scrollingElement || this.doc.body, 'scroll')
      ] : [])
    ).pipe(
      takeUntil(this.pagingEnd),
      debounceTime(200),
      exhaustMap(() => this.fetchDataAuto()),
      catchError(() => [])
    ).subscribe(data => {
      this.productListModel.push(...data);
      this.changeDetector.markForCheck();

      if (this.total <= this.productListModel.length) {
        this.fetching = false;
        this.pagingEnd.next();
        this.pagingEnd.complete();
        return;
      }

      // after rendering view
      setTimeout(() => {
        if (this.needRefresh()) {
          this.refreshTrigger.next();
        } else {
          this.fetching = false;
          this.changeDetector.markForCheck();
        }
      });
    });

    this.refreshTrigger.next();
  }

  ngOnDestroy() {
    if (!this.pagingEnd.closed) {
      this.pagingEnd.next();
      this.pagingEnd.complete();
    }
  }

  public range(n = 0) {

    return Array(n).fill(null);
  }

  private needRefresh() {
    if (!this.isBrowser) return false;

    const { bottom } = this.listContainerElRef.nativeElement.getBoundingClientRect();

    return bottom < window.innerHeight;
  }

  private fetchDataAuto() {
    
    return this.productAPI.getProductList(void 0, { skip: this.pageIndex * this.pageSize, take: this.pageSize }).pipe(
      map(res => {
        this.total = res.total;
        this.pageIndex++;

        return res.data;
      })
    );
  }
  
}
