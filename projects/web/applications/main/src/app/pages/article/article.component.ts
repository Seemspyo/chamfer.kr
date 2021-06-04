import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Article, ArticleListData } from '@chamfer/server';
import { ArticleAPI } from 'common/api/article.api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { itemsPerPage } from './article.resolver';


@Component({
  selector: 'chamfer-article',
  templateUrl: 'article.component.html',
  styleUrls: [ 'article.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleComponent implements OnInit, OnDestroy {

  public total!: number;
  public articleListModel!: Article[];
  public pageIndex!: number;

  public category!: string;

  private destroyed = new Subject<void>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private route: ActivatedRoute,
    private articleAPI: ArticleAPI
  ) { }

  ngOnInit() {
    {
      let first = true;

      this.route.data.pipe( takeUntil(this.destroyed) )
      .subscribe(routeData => {
        const { articleListData: { total, data }, articleCategory } = routeData;
    
        this.total = total;
        this.articleListModel = data;
        this.category = articleCategory;

        if (first) {
          first = false;
          return;
        }

        this.changeDetector.markForCheck();
      });
    }

    {
      let first = true;

      this.route.queryParamMap.pipe( takeUntil(this.destroyed) )
      .subscribe(map => {
        const index = parseInt(map.get('page') || '0');

        if (this.pageIndex === index) return;

        this.pageIndex = index;

        if (first) {
          first = false;
          return;
        }

        this.refreshList();
        this.changeDetector.markForCheck();
      });
    }
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public getMaxIndex() {
    
    return Math.ceil(this.total / itemsPerPage) - 1;
  }

  public max(...args: number[]) {

    return Math.max(...args);
  }

  public min(...args: number[]) {

    return Math.min(...args);
  }

  public getPagingData() {

    return Array(this.getMaxIndex() + 1).fill(null);
  }

  private async refreshList() {
    let data: ArticleListData;

    try {
      data = await this.articleAPI.getArticleList(
        { category: this.category },
        void 0,
        { skip: this.pageIndex * itemsPerPage, take: itemsPerPage },
        [ 'id', 'category', 'title', 'uri', 'createdAt' ],
        [ 'username' ]
      ).toPromise();
    } catch {

      return;
    }

    if (this.total !== data.total) {
      this.total = data.total;
    }

    this.articleListModel = data.data;
    this.changeDetector.markForCheck();
  }

}
