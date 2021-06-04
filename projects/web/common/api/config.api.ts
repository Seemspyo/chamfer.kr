import { Injectable } from '@angular/core';
import { JSONData } from '@chamfer/server';
import { GQLClient } from 'common/graphql/client';
import { HTTP_STATE_EXPLICIT } from 'common/http-transfer';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';


@Injectable()
export class ConfigAPI {

  private queries = {
    get: gql`
      query ($id: String!) {
        config: getJSONData(id: $id) {
          id
          data
        }
      }
    `,
    set: gql`
      mutation ($id: String!, $data: String!) {
        config: setJSONData(id: $id, data: $data) {
          id
          data
        }
      }
    `
  }

  constructor(
    private graphql: GQLClient
  ) { }

  public getConfig<T>(id: string) {

    return this.graphql.query<{ config: JSONData|null }>(this.queries.get, { id }, { params: { [ HTTP_STATE_EXPLICIT ]: id } }).pipe(
      map(res => res.config && JSON.parse(res.config.data) as T)
    );
  }

  public setConfig<T>(id: string, data: T) {

    return this.graphql.query<{ config: JSONData }>(this.queries.set, { id, data: JSON.stringify(data) }).pipe(
      map(res => JSON.parse(res.config.data) as T)
    );
  }

}
