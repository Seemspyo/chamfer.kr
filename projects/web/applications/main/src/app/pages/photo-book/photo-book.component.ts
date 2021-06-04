import {
  animate,
  AnimationEvent,
  query,
  stagger,
  style,
  transition,
  trigger
} from '@angular/animations';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { Photo } from '@chamfer/server';
import { PhotoAPI } from 'common/api/photo.api';
import { fromEvent, merge, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  exhaustMap,
  filter,
  map,
  takeUntil
} from 'rxjs/operators';


const
itemAnimation = trigger('itemAnimation', [

  transition('* => *', [
    query(':enter', [
      style({ opacity: '0' }),
      stagger(200, [
        animate('0.5s', style({ opacity: '1' }))
      ])
    ], { optional: true })
  ])

]),
dialogAnimation = trigger('dialogAnimation', [

  transition('* => opened', [
    style({ opacity: '0' }),
    animate('0.3s', style({ opacity: '1' }))
  ]),

  transition('opened => closed', [
    style({ opacity: '1' }),
    animate('0.3s', style({ opacity: '0' }))
  ])

]);

@Component({
  selector: 'chamfer-photo-book',
  templateUrl: 'photo-book.component.html',
  styleUrls: [ 'photo-book.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    itemAnimation,
    dialogAnimation
  ]
})
export class PhotoBookComponent {

  public galleryModel: Photo[] = []
  public fetching = true;

  public selectedPhoto: Photo|null = null;

  private refreshTrigger = new Subject<void>();
  private pagingEnd = new Subject<void>();

  @ViewChild('listContainer')
  listContainerElRef!: ElementRef<HTMLElement>;

  @ViewChild('PhotoDialog')
  photoDialogTemplateRef!: TemplateRef<any>;

  public photoOverlayState: 'closed'|'opened' = 'closed';
  private photoOverlayRef: OverlayRef|null = null;

  private pageIndex = 0;
  private pageSize = 21;
  private total!: number;

  private isBrowser: boolean;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private photoAPI: PhotoAPI,
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(DOCUMENT) private doc: Document,
    private overlay: Overlay,
    private viewRef: ViewContainerRef
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
      this.galleryModel.push(...data);
      this.changeDetector.markForCheck();

      if (this.total <= this.galleryModel.length) {
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

  public openPhotoDialog(photo: Photo) {
    if (this.selectedPhoto === photo || this.photoOverlayRef) return;

    this.selectedPhoto = photo;
    this.photoOverlayState = 'opened';

    const overlayRef = this.overlay.create({
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global(),
      width: '100%',
      height: '100%'
    });

    overlayRef.keydownEvents().pipe(
      filter(event => !this.hasAnyModifierKey(event) && event.key.toLowerCase() === 'escape')
    ).subscribe(() => this.closePhotoDialog());

    overlayRef.attach(new TemplatePortal(this.photoDialogTemplateRef, this.viewRef));

    this.photoOverlayRef = overlayRef;
    this.changeDetector.markForCheck();
  }

  public closePhotoDialog() {
    if (!this.photoOverlayRef) return;

    this.photoOverlayState = 'closed';
    this.changeDetector.markForCheck();
  }

  public handlePhotoKeyEvent(event: KeyboardEvent, photo: Photo) {
    if (this.hasAnyModifierKey(event) || event.key.toLowerCase() !== 'enter') return;

    event.preventDefault();

    this.openPhotoDialog(photo);
  }

  public handleDialogAnimationEvent({ phaseName, fromState, toState }: AnimationEvent) {
    if ([ phaseName, fromState, toState ].join('|') === 'done|opened|closed') {
      this.photoOverlayRef!.dispose();

      this.photoOverlayRef =
      this.selectedPhoto = null;
    }
  }

  private hasAnyModifierKey(event: KeyboardEvent) {

    return event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
  }

  private needRefresh() {
    if (!this.isBrowser) return false;

    const { bottom } = this.listContainerElRef.nativeElement.getBoundingClientRect();

    return bottom < window.innerHeight;
  }

  private fetchDataAuto() {
    
    return this.photoAPI.getPhotoList(void 0, { skip: this.pageIndex * this.pageSize, take: this.pageSize }).pipe(
      map(res => {
        this.total = res.total;
        this.pageIndex++;

        return res.data;
      })
    );
  }

}
