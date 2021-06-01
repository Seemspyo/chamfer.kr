import { Injectable } from '@angular/core';
import {
  ListSearch,
  Paging,
  User,
  UserCreateInput,
  UserListData,
  UserUpdateInput
} from '@chamfer/server';
import { GQLClient } from 'common/graphql/client';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { GQLFieldOf } from './selection';


export const USER_FIELDS = [
  'id',
  'email',
  'username',
  'provider',
  'roles',
  'joinedAt'
] as const;

@Injectable()
export class UserAPI {

  constructor(
    private graphql: GQLClient
  ) { }

  public getUserList(search?: ListSearch, paging?: Paging, select: GQLFieldOf<User> = USER_FIELDS) {
    const query = gql`
      query ($search: ListSearch, $paging: Paging) {
        data: getUserList(search: $search, paging: $paging) {
          total
          data {
            ${ select.join('\n') }
          }
        }
      }
    `;

    return this.graphql.query<{ data: UserListData }>(query, { search, paging }).pipe(
      map(res => res.data)
    );
  }

  public createUser(input: UserCreateInput, select: GQLFieldOf<User> = USER_FIELDS) {
    const query = gql`
      mutation ($input: UserCreateInput!) {
        user: createUser(input: $input) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.query<{ user: User }>(query, { input }).pipe(
      map(res => res.user)
    );
  }

  public updateUser(id: string, input: UserUpdateInput, select: GQLFieldOf<User> = USER_FIELDS) {
    const query = gql`
      mutation ($id: String!, $input: UserUpdateInput!) {
        user: updateUser(id: $id, input: $input) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.query<{ user: User }>(query, { id, input }).pipe(
      map(res => res.user)
    );
  }

  public deleteUser(id: string) {
    const query = gql`
      mutation ($id: String!) {
        result: deleteUser(id: $id)
      }
    `;

    return this.graphql.query<{ result: boolean }>(query, { id }).pipe(
      map(res => res.result)
    );
  }

}
