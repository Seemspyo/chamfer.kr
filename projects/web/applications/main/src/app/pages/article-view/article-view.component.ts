import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  SecurityContext,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Article } from '@chamfer/server';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer';
import { DomSanitizer } from '@angular/platform-browser';


@Component({
  selector: 'chamfer-article-view',
  templateUrl: 'article-view.component.html',
  styleUrls: [ 'article-view.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleViewComponent implements OnInit, AfterViewInit, OnDestroy {

  public article!: Article;

  @ViewChild('view')
  viewElRef!: ElementRef<HTMLElement>;

  private viewerRef: Viewer|null = null;
  private destroyed = new Subject<void>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.route.data.pipe( takeUntil(this.destroyed) )
    .subscribe(data => {
      if (!data.articleData) {
        this.router.navigateByUrl('/404', { replaceUrl: true });
        return;
      }

      this.article = data.articleData;
      this.refreshContent();
      this.changeDetector.markForCheck();
    });
  }

  ngAfterViewInit() {
    this.viewerRef = new Viewer({
      el: this.viewElRef.nativeElement,
      initialValue: this.article.content,
      linkAttribute: {
        target: '_blank'
      },
      customHTMLSanitizer: html => this.sanitizer.sanitize(SecurityContext.HTML, html) || ''
    });
  }

  ngOnDestroy() {
    this.viewerRef?.remove();
    this.destroyed.next();
    this.destroyed.complete();
  }

  private refreshContent() {
    if (!this.viewerRef) return;

    this.viewerRef.setMarkdown(this.article.content);
  }

}
