import { Injectable } from '@angular/core';
import { Banner, BannerCreateInput, BannerListData, BannerUpdateInput, ListSearch, Paging } from '@chamfer/server';
import { GQLClient } from 'common/graphql/client';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { GQLFieldOf } from './selection';


export const BANNER_FIELDS = [
  'id',
  'name',
  'thumbnailURL',
  'thumbnailURLAlt',
  'link',
  'linkTarget',
  'active',
  'startDisplayAt',
  'endDisplayAt',
  'createdAt'
] as const;

@Injectable()
export class BannerAPI {

  constructor(
    private graphql: GQLClient
  ) { }

  /** Banner list regards starts & ends date */
  public getPublicBannerList(search?: ListSearch, paging?: Paging, select: GQLFieldOf<Omit<Banner, 'author'>> = BANNER_FIELDS) {
    const query = gql`
      query ($search: ListSearch, $paging: Paging) {
        data: getBannerList(search: $search, paging: $paging) {
          total
          data {
            ${ select.join('\n') }
          }
        }
      }
    `;

    return this.graphql.query<{ data: BannerListData }>(query, { search, paging }).pipe(
      map(res => res.data)
    );
  }

  public getBannerList(search?: ListSearch, paging?: Paging, select: GQLFieldOf<Banner> = BANNER_FIELDS) {
    const query = gql`
      query ($search: ListSearch, $paging: Paging) {
        data: getBannerListAll(search: $search, paging: $paging) {
          total
          data {
            ${ select.join('\n') }
          }
        }
      }
    `;

    return this.graphql.query<{ data: BannerListData }>(query, { search, paging }).pipe(
      map(res => res.data)
    );
  }

  public createBanner(input: BannerCreateInput, select: GQLFieldOf<Banner> = BANNER_FIELDS) {
    const query = gql`
      mutation ($input: BannerCreateInput!) {
        banner: createBanner(input: $input) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.query<{ banner: Banner }>(query, { input }).pipe(
      map(res => res.banner)
    );
  }

  public updateBanner(id: string, input: BannerUpdateInput, select: GQLFieldOf<Banner> = BANNER_FIELDS) {
    const query = gql`
      mutation ($id: String!, $input: BannerUpdateInput!) {
        banner: updateBanner(id: $id, input: $input) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.query<{ banner: Banner }>(query, { id, input }).pipe(
      map(res => res.banner)
    );
  }

  public deleteBanner(id: string) {
    const query = gql`
      mutation ($id: String!) {
        result: deleteBanner(id: $id)
      }
    `;

    return this.graphql.query<{ result: boolean }>(query, { id }).pipe(
      map(res => res.result)
    );
  }

}
