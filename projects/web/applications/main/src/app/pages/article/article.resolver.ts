import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { ArticleListData } from '@chamfer/server';
import { ArticleAPI } from 'common/api/article.api';


export const itemsPerPage = 10;

@Injectable()
export class ArticleResolver implements Resolve<ArticleListData> {

  constructor(
    private articleAPI: ArticleAPI
  ) { }

  resolve(snapshot: ActivatedRouteSnapshot) {
    const
    { articleCategory: category } = snapshot.data,
    page = parseInt(snapshot.queryParamMap.get('page') || '0');

    return this.articleAPI.getArticleList(
      { category },
      void 0,
      { skip: page * itemsPerPage, take: itemsPerPage },
      [ 'id', 'category', 'title', 'uri', 'createdAt' ],
      [ 'username' ]
    );
  }

}
