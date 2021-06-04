import { Injectable } from '@angular/core';
import {
  Article,
  ArticleCreateInput,
  ArticleFetchOptions,
  ArticleListData,
  ArticleUpdateInput,
  ListSearch,
  Paging,
  User
} from '@chamfer/server';
import { GQLClient } from 'common/graphql/client';
import { HTTP_STATE_EXPLICIT } from 'common/http-transfer';
import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { makeUniqueKey } from './make-unique-key';
import { GQLFieldOf } from './selection';


export const ARTICLE_FIELDS = [
  'id',
  'category',
  'title',
  'uri',
  'description',
  'content',
  'thumbnailURL',
  'isDraft',
  'locked',
  'createdAt',
  'lastUpdatedAt'
] as const;

type ArticleField = GQLFieldOf<Omit<Article, 'author'|'collaborators'>>;

@Injectable()
export class ArticleAPI {

  constructor(
    private graphql: GQLClient
  ) { }

  public getArticleList(
    options?: ArticleFetchOptions,
    search?: ListSearch,
    paging?: Paging,
    select: ArticleField = ARTICLE_FIELDS,
    userSelect?: GQLFieldOf<User>
  ) {
    const userFragment = userSelect?.join('\n') ?? '';

    const query = gql`
      query ($options: ArticleFetchOptions, $search: ListSearch, $paging: Paging) {
        data: getArticleList(options: $options, search: $search, paging: $paging) {
          total
          data {
            ${ select.join('\n') }
            ${ userFragment ? 'author { '+ userFragment +' } collaborators { ' + userFragment +' }' : '' }
          }
        }
      }
    `;

    return this.graphql.query<{ data: ArticleListData }>(query, { options, search, paging }, { params: { [ HTTP_STATE_EXPLICIT ]: makeUniqueKey(options, search, paging, select, userSelect) } }).pipe(
      map(res => res.data)
    );
  }

  public getArticle(uri: string, select?: ArticleField, userSelect?: GQLFieldOf<User>): Observable<Article>;
  public getArticle(id: number, select?: ArticleField, userSelect?: GQLFieldOf<User>): Observable<Article>;
  public getArticle(uriOrId: string|number, select: ArticleField = ARTICLE_FIELDS, userSelect?: GQLFieldOf<User>) {
    const userFragment = userSelect?.join('\n') ?? '';

    const query = gql`
      query ($uri: String, $id: Int) {
        article: getArticle(uri: $uri, id: $id) {
          ${ select.join('\n') }
          ${ userFragment ? 'author { '+ userFragment +' } collaborators { ' + userFragment +' }' : '' }
        }
      }
    `;

    return this.graphql.query<{ article: Article }>(query, { [ typeof uriOrId === 'number' ? 'id' : 'uri' ]: uriOrId }, { params: { [ HTTP_STATE_EXPLICIT ]: makeUniqueKey(uriOrId, select, userSelect) } }).pipe(
      map(res => res.article)
    );
  }

  public createArticle(input: ArticleCreateInput, select: ArticleField = ARTICLE_FIELDS) {
    const query = gql`
      mutation ($input: ArticleCreateInput!) {
        article: createArticle(input: $input) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.query<{ article: Article }>(query, { input }).pipe(
      map(res => res.article)
    );
  }

  public updateArticle(id: number, input: ArticleUpdateInput, select: ArticleField = ARTICLE_FIELDS) {
    const query = gql`
      mutation ($id: Int!, $input: ArticleUpdateInput!) {
        article: updateArticle(id: $id, input: $input) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.query<{ article: Article }>(query, { id, input }).pipe(
      map(res => res.article)
    );
  }

  public deleteArticle(id: number) {
    const query = gql`
      mutation ($id: Int!) {
        result: deleteArticle(id: $id)
      }
    `;

    return this.graphql.query<{ result: boolean }>(query, { id }).pipe(
      map(res => res.result)
    );
  }

}
