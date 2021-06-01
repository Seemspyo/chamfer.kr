import { coerceNumberProperty } from '@angular/cdk/coercion';
import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  PLATFORM_ID,
  QueryList,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { SlideTabItem } from './slide-tab-item';
import { ResizeObserver } from 'resize-observer';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
  selector: 'slide-tab',
  templateUrl: 'slide-tab.html',
  styleUrls: [ 'slide-tab.scss' ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'slide-tab'
  }
})
export class SlideTab implements AfterContentInit, AfterViewInit, OnDestroy {

  _overflowed = false;

  @Input('initialTab')
  initialTab?: number;

  @ContentChildren(SlideTabItem)
  items?: QueryList<SlideTabItem>;

  @ViewChild('scrollContainer')
  scrollContainerRef?: ElementRef<HTMLElement>;

  private index = -1;
  private resizeObserver!: ResizeObserver;
  private isBrowser!: boolean;
  _maxIndex = 0;

  private destroyed = new Subject<void>();
  private currentItem: SlideTabItem|null = null;

  constructor(
    private changeDetector: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterContentInit() {
    this.items!.changes.pipe(
      takeUntil(this.destroyed)
    ).subscribe(() => this.detectMaxIndex());

    this.detectMaxIndex();
  }

  ngAfterViewInit() {
    if (!ResizeObserver || !this.isBrowser) return;

    this.resizeObserver = new ResizeObserver(() => this.detectOverflow());

    this.resizeObserver.observe(this.scrollContainerRef!.nativeElement);
    setTimeout(() => {
      this.detectOverflow();
      if (typeof this.initialTab === 'number') {
        this.setIndex(this.initialTab);
      } else {
        this.navigateTo(this.index = 0);
      }
    });
  }

  ngOnDestroy() {
    this.resizeObserver.disconnect();
    this.destroyed.next();
    this.destroyed.complete();
  }

  public currentIndex() {

    return this.index;
  }

  public setIndex(index: number) {
    index = Math.max(0, Math.min(this._maxIndex, coerceNumberProperty(index)));

    if (this.index === index) return;

    this.index = index;
    this.navigateTo(index);
    this.changeDetector.markForCheck();
  }

  _navigate(direction: string) {
    this.setIndex(this.index + (direction === 'prev' ? -1 : +1));
  }

  private navigateTo(index: number) {
    const target = this.items?.get(index);

    if (!target) return;
    if (this.currentItem) {
      this.currentItem.active = false;
    }

    target.active = true;
    this.currentItem = target;

    const
    containerEl = this.scrollContainerRef?.nativeElement,
    targetEl = target?.elRef.nativeElement;

    if (!containerEl || !targetEl) return;

    const left = containerEl.scrollLeft + (targetEl.getBoundingClientRect().left - containerEl.getBoundingClientRect().left);

    containerEl.scrollTo({ left, behavior: 'smooth' });
  }

  private detectOverflow() {
    const el = this.scrollContainerRef?.nativeElement;

    if (!el) return;

    const overflowed = el.scrollWidth > el.offsetWidth;

    if (this._overflowed !== overflowed) {
      this._overflowed = overflowed;
      this.changeDetector.markForCheck();
    }
  }

  private detectMaxIndex() {
    if (!this.items) return;

    const max = Math.max(0, this.items.length - 1);

    if (this._maxIndex === max) return;

    this._maxIndex = max;
    this.changeDetector.markForCheck();
  }

}
