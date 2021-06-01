import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Article } from '@chamfer/server';
import { ArticleAPI } from 'common/api/article.api';
import { parseGQLError } from 'common/api/errors';
import { merge, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  switchMap,
  takeUntil
} from 'rxjs/operators';


@Component({
  selector: 'article-list',
  templateUrl: 'article-list.component.html',
  styleUrls: [ 'article-list.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleListComponent implements OnInit, AfterViewInit, OnDestroy {

  public searchForm = this.formBuilder.group({
    searchTargets: [ [ 'title' ], [ Validators.required ] ],
    searchValue: [ '' ],
    onlyDraft: [ false, [ Validators.required ] ]
  });

  public articleListModel: Article[] = []
  public totalLength = 0;

  private refreshTrigger = new Subject<void>();

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  private destroyed = new Subject<void>();

  private processing = false;
  public category!: string;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private articleAPI: ArticleAPI,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.setCategoryFrom(this.route.snapshot.paramMap);

    this.route.paramMap.pipe( takeUntil(this.destroyed) )
    .subscribe(map => {
      this.setCategoryFrom(map);
      this.refresh();
    });
  }

  ngAfterViewInit() {
    merge(
      this.refreshTrigger.pipe( debounceTime(200) ),
      this.paginator.page
    ).pipe(
      switchMap(() => this.fetchListData().pipe(
        catchError(error => {
          const message = parseGQLError(error)
                          .reduce((message, e) => `${ message }${ e.message }\n`, '');
    
          this.snackBar.open(message);

          return of({ total: 0, data: [] });
        })
      )),
      takeUntil(this.destroyed)
    ).subscribe(data => {
      this.totalLength = data.total;
      this.articleListModel = data.data;
      this.changeDetector.markForCheck();
    });

    this.refresh();
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public refresh() {
    this.refreshTrigger.next();
  }

  async _deleteArticle(article: Article) {
    if (this.processing || !confirm('삭제한 게시글은 복구할 수 없습니다.\n진행하시겠습니까?')) return;

    let result: boolean;
    try {
      result = await this.articleAPI.deleteArticle(article.id).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.processing = false;
    }

    if (result) {
      this.snackBar.open('게시글을 삭제하였습니다.');
      this.refresh();
    } else {
      this.snackBar.open('게시글을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  _dateGreaterThan(a: Date|string, b: Date|string) {
    if (!(a instanceof Date)) a = new Date(a);
    if (!(b instanceof Date)) b = new Date(b);

    return a.getTime() < b.getTime();
  }

  private fetchListData() {
    const { searchTargets, searchValue, onlyDraft } = this.searchForm.value;
    const { pageIndex, pageSize: take } = this.paginator;

    return this.articleAPI.getArticleList(
      { onlyDraft, withDraft: true, withLocked: true, category: this.category },
      searchValue ? { searchTargets, searchValue } : void 0,
      { skip: pageIndex * take, take },
      [ 'id', 'category', 'title', 'uri', 'isDraft', 'locked', 'createdAt', 'lastUpdatedAt' ],
      [ 'id', 'username', 'email', 'roles' ]
    );
  }

  private setCategoryFrom(paramMap: ParamMap) {
    const category = paramMap.get('category');

    if (!category || this.category === category) return;

    this.category = category;
    this.changeDetector.markForCheck();
  }

}
