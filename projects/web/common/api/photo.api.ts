import { Injectable } from '@angular/core';
import { GQLClient } from 'common/graphql/client';
import { GQLFieldOf } from './selection';
import { ListSearch, Paging, Photo, PhotoCreateInput, PhotoListData, PhotoUpdateInput } from '@chamfer/server';
import gql from 'graphql-tag';
import { HTTP_STATE_EXPLICIT } from 'common/http-transfer';
import { makeUniqueKey } from './make-unique-key';
import { map } from 'rxjs/operators';


export const PHOTO_FIELDS = [
  'id',
  'name',
  'resourceURL',
  'active',
  'createdAt'
] as const;

type PhotoField = GQLFieldOf<Omit<Photo, 'author'>>;

@Injectable()
export class PhotoAPI {

  constructor(
    private graphql: GQLClient
  ) { }

  public getPhotoList(search?: ListSearch, paging?: Paging, withActive = false, select: PhotoField = PHOTO_FIELDS) {
    const query = gql`
      query ($search: ListSearch, $paging: Paging) {
        data: getPhotoList${ withActive ? 'All' : '' }(search: $search, paging: $paging) {
          total
          data {
            ${ select.join('\n') }
          }
        }
      }
    `;

    return this.graphql.query<{ data: PhotoListData }>(query, { search, paging }, { params: { [ HTTP_STATE_EXPLICIT ]: makeUniqueKey(search, paging, select) } }).pipe(
      map(res => res.data)
    );
  }

  public createPhoto(input: PhotoCreateInput, select: PhotoField = PHOTO_FIELDS) {
    const query = gql`
      mutation ($input: PhotoCreateInput!) {
        photo: createPhoto(input: $input) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.query<{ photo: Photo }>(query, { input }).pipe(
      map(res => res.photo)
    );
  }

  public updatePhoto(id: number, input: PhotoUpdateInput, select: PhotoField = PHOTO_FIELDS) {
    const query = gql`
      mutation ($id: Int!, $input: PhotoUpdateInput!) {
        photo: updatePhoto(id: $id, input: $input) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.query<{ photo: Photo }>(query, { id, input }).pipe(
      map(res => res.photo)
    );
  }

  public deletePhoto(id: number) {
    const query = gql`
      mutation ($id: Int!) {
        result: deletePhoto(id: $id)
      }
    `;

    return this.graphql.query<{ result: boolean }>(query, { id }).pipe(
      map(res => res.result)
    );
  }

}
