import { BreakpointObserver } from '@angular/cdk/layout';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Article, ArticleCreateInput, ArticleUpdateInput } from '@chamfer/server';
import { VOID } from '@chamfer/util/dist/void';
import { ArticleAPI } from 'common/api/article.api';
import { parseGQLError } from 'common/api/errors';
import { ToastEditor } from 'common/toast-editor-wrapper';
import { interval, merge, Subject } from 'rxjs';
import { exhaustMap, takeUntil } from 'rxjs/operators';


@Component({
  selector: 'article-write',
  templateUrl: 'article-write.component.html',
  styleUrls: [ 'article-write.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleWriteComponent implements OnInit, AfterViewInit, OnDestroy {

  public articleForm!: FormGroup;

  public mode!: 'create'|'update';
  public originalArticle?: Article;

  private processing = false;

  private destroyed = new Subject<void>();
  private modeChanged = new Subject<void>();

  @ViewChild(ToastEditor)
  editorRef!: ToastEditor;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private articleAPI: ArticleAPI,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private mediaObserver: BreakpointObserver
  ) { }

  ngOnInit() {
    this.route.data.pipe( takeUntil(this.destroyed) )
    .subscribe(data => this.initializeWith(data.article));

    this.route.queryParamMap.pipe( takeUntil(this.destroyed) )
    .subscribe(map => this.setCategoryFrom(map));
  }

  ngAfterViewInit() {
    if (this.mode === 'create' || this.originalArticle?.isDraft) {
      interval(60 * 1e3).pipe(
        takeUntil(merge(this.destroyed, this.modeChanged)),
        exhaustMap(() => this.saveAsDraft())
      )
      .subscribe(VOID);
    }
    
    {
      const branchPoint = '(max-width: 1028px)';

      this.mediaObserver.observe(branchPoint)
      .pipe( takeUntil(this.destroyed) )
      .subscribe(data => {
        this.editorRef.editor?.changePreviewStyle(data.matches ? 'tab' : 'vertical');
      });
  
      this.editorRef.editor?.changePreviewStyle(this.mediaObserver.isMatched(branchPoint) ? 'tab' : 'vertical');
    }
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public canSave() {
    if (this.articleForm.invalid || this.processing) {

      return false;
    }

    switch (this.mode) {

      case 'create': {

        return true;
      }

      case 'update': {
        const values = this.articleForm.value;

        for (const key in values) {
          if (values[key] !== this.originalArticle![key as keyof ArticleCreateInput]) {

            return true;
          }
        }

        return false;
      }

    }
  }

  public save(asDraft = false) {
    if (!this.canSave()) return Promise.resolve(null);

    if (!asDraft && !this.modeChanged.closed) {
      this.modeChanged.next();
      this.modeChanged.complete();
    }

    switch (this.mode) {

      case 'create': {

        return this.createArticle(asDraft);
      }

      case 'update': {

        return this.updateArticle(asDraft);
      }

    }
  }

  public async saveAsDraft() {
    const article = await this.save(true);

    if (article) this.snackBar.open('게시글을 임시 저장하였습니다.');
  }

  _isDraft() {

    return this.mode === 'create' || this.originalArticle?.isDraft;
  }

  private initializeWith(article?: Article) {
    this.mode = !article ? 'create' : 'update';
    this.originalArticle = article;
    this.setFormOf(article);
    
    this.changeDetector.markForCheck();
  }

  private setFormOf(article?: Article) {
    this.articleForm = this.formBuilder.group({
      category: [ article?.category, [ Validators.required ] ],
      title: [ article?.title, [ Validators.required, Validators.maxLength(256) ] ],
      uri: [ article?.uri, [ Validators.maxLength(256), Validators.pattern(/^[\w]+$/) ] ],
      description: [ article?.description, [ Validators.maxLength(512) ] ],
      content: [ article?.content, [ Validators.required ] ],
      thumbnailURL: [ article?.thumbnailURL, [ Validators.maxLength(512) ] ],
      locked: [ article?.locked ?? false, [ Validators.required ] ]
    });
  }

  private setCategoryFrom(queryParamMap: ParamMap) {
    const category = queryParamMap.get('category') || this.originalArticle?.category;

    if (category !== this.articleForm.get('category')!.value) {
      this.articleForm.get('category')!.setValue(category);
    }

    this.changeDetector.markForCheck();
  }

  private async createArticle(isDraft = false) {
    this.markProcessing();

    const input: ArticleCreateInput = { ...this.articleForm.value, isDraft }

    let article: Article;
    try {
      article = await this.articleAPI.createArticle(input).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.initializeWith(article);
    if (!isDraft) this.snackBar.open('게시글을 생성하였습니다.');

    return article;
  }

  private async updateArticle(isDraft = false) {
    this.markProcessing();

    const values = this.articleForm.value;

    const input: ArticleUpdateInput = { isDraft }

    for (const _key in values) {
      const key = _key as keyof ArticleUpdateInput;

      if (values[key] !== this.originalArticle![key]) {
        input[key] = values[key];
      }
    }

    let article: Article;
    try {
      article = await this.articleAPI.updateArticle(this.originalArticle!.id, input).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.initializeWith(article);
    if (!isDraft) this.snackBar.open('게시글을 수정하였습니다.');

    return article;
  }

  private markProcessing(state = true) {
    if (state === this.processing) return;

    this.processing = state;
    this.changeDetector.markForCheck();
  }

}
