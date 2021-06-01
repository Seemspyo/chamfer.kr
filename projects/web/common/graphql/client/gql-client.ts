import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  Optional,
  SkipSelf
} from '@angular/core';
import {
  AngularHttpOptions,
  GQLErrorPipe,
  GQLResponse
} from './@gql-client';
import { DocumentNode, print } from 'graphql';
import { map } from 'rxjs/operators';


export class GQLClientConfig {

  uri: string = '/graphql';
  errorPipe?: GQLErrorPipe;

}

@Injectable()
export class GQLClient {

  private http!: HttpClient;
  private config!: GQLClientConfig;

  constructor(
    http: HttpClient,
    @Optional() @SkipSelf() parentHttp?: HttpClient,
    config?: GQLClientConfig
  ) {
    this.http = parentHttp || http;
    this.config = { ...new GQLClientConfig(), ...config }
  }

  public query<T>(query: DocumentNode, variables?: Record<string, any>, options?: AngularHttpOptions) {

    return this.http.post<GQLResponse<T>>(this.config.uri, {

      query: print(query),
      variables

    }, options).pipe(

      map(res => {

        if (res.errors?.length) {

          throw this.config.errorPipe?.(res.errors) || res.errors;
        }

        return res.data!;
      })

    );
  }

  // if wonder why implements multipart/form-data like this, see https://www.floriangaechter.com/blog/graphql-file-uploading/
  public upload<T>(query: DocumentNode, variables: Record<string, File>, options?: AngularHttpOptions) {
    const data = new FormData();

    const
    varMap: Record<string, [ string ]> = { },
    altMap: Record<string, null> = { }

    for (const key in variables) {
      varMap[key] = [ `variables.${ key }` ]
      altMap[key] = null;
    }

    data.append('operations', JSON.stringify({ query: print(query), variables: altMap }));
    data.append('map', JSON.stringify(varMap));

    // datas must follows `map` field. `graphql-upload` throws an error otherwise.
    for (const key in variables) {
      data.append(key, variables[key]);
    }

    return this.http.post<GQLResponse<T>>(this.config.uri, data, options).pipe(

      map(res => {

        if (res.errors?.length) {

          throw this.config.errorPipe?.(res.errors) || res.errors;
        }

        return res.data!;
      })

    );
  }

}
