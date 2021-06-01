import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Article } from '@chamfer/server';
import { ArticleAPI, ARTICLE_FIELDS } from './article.api';
import { USER_FIELDS } from './user.api';


@Injectable()
export class ArticleResolver implements Resolve<Article|null> {

  constructor(
    private articleAPI: ArticleAPI
  ) { }

  resolve(route: ActivatedRouteSnapshot) {
    const
    id = route.paramMap.get('id'),
    uri = route.paramMap.get('uri');

    if (!(id || uri)) {

      return null;
    }

    return this.articleAPI.getArticle((uri || parseInt(id!)) as any, ARTICLE_FIELDS, USER_FIELDS);
  }

}
