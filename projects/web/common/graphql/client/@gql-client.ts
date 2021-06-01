import { HttpHeaders, HttpParams } from '@angular/common/http';


export type GQLErrorPipe<T = any> = (errors: GQLError[]) => T;

export interface GQLResponse<DataT = any, ErrorT = GQLError> {

  data: DataT | null;
  errors?: ErrorT[];

}

export interface GQLError<T = any> {

  message: string;
  extensions: {
    code: string;
  } & T;

}

export interface AngularHttpOptions {
  headers?: HttpHeaders | { [header: string]: string | string[]; }
  params?: HttpParams | { [param: string]: string | string[]; }
  reportProgress?: boolean;
  withCredentials?: boolean;
}
