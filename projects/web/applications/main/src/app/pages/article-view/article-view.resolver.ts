import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Article } from '@chamfer/server';
import { ArticleAPI } from 'common/api/article.api';


@Injectable()
export class ArticleViewResolver implements Resolve<Article|null> {

  constructor(
    private articleAPI: ArticleAPI
  ) { }

  resolve(snapshot: ActivatedRouteSnapshot) {
    const idOrUri = snapshot.paramMap.get('idOrUri');

    if (!idOrUri) {

      return null;
    }

    return this.articleAPI.getArticle((/^[0-9]*$/.test(idOrUri) ? parseInt(idOrUri) : idOrUri) as any, void 0, [ 'username' ]);
  }

}
