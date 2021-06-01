import { Injectable } from '@angular/core';
import { UploadLog } from '@chamfer/server';
import { GQLClient } from 'common/graphql/client';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { GQLFieldOf } from './selection';


export const UPLOAD_LOG_FIELDS = [
  'id',
  'userId',
  'from',
  'provider',
  'origin',
  'path',
  'mimetype',
  'href',
  'uploadAt'
] as const;

@Injectable()
export class UploadAPI {

  constructor(
    private graphql: GQLClient
  ) { }

  public singleUpload(file: File, select: GQLFieldOf<UploadLog> = UPLOAD_LOG_FIELDS) {
    const query = gql`
      mutation ($file: Upload!) {
        log: singleUpload(file: $file) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.upload<{ log: UploadLog }>(query, { file }).pipe(
      map(res => res.log)
    );
  }

}
