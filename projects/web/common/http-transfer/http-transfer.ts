import {
  Inject,
  Injectable,
  PLATFORM_ID
} from '@angular/core';
import {
  makeStateKey,
  StateKey,
  TransferState
} from '@angular/platform-browser';
import {
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { tap } from 'rxjs/operators';
import { of } from 'rxjs';


export const
HTTP_STATE_EXPLICIT = 'Θstate-key',
HTTP_STATE_IGNORE = 'Θstate-ignore';

/**
 * This Module automatically set state from `HttpRequest.url`.
 * For same url(like graphql, post request), must set id to `HttpParams` with `HTTP_STATE_EXPLICIT`.
 * 
 * ex) http.get('some-uri', { params: { [ HTTP_STATE_EXPLICIT ]: 'any-id' } });
 */
@Injectable()
export class HttpTransfer implements HttpInterceptor {

  private isServer!: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformID: Object,
    private state: TransferState
  ) {
    this.isServer = isPlatformServer(platformID);
  }

  intercept(req: HttpRequest<any>, handler: HttpHandler) {
    if (req.params.has(HTTP_STATE_IGNORE)) {

      return handler.handle(req.clone({
        params: req.params.delete(HTTP_STATE_IGNORE)
      }));
    }

    let key: StateKey<void>;

    if (req.params.has(HTTP_STATE_EXPLICIT)) {

      const id = req.params.get(HTTP_STATE_EXPLICIT);

      req = req.clone({
        params: req.params.delete(HTTP_STATE_EXPLICIT)
      });

      key = makeStateKey(`${ req.method }-${ id }`);

    } else {

      key = makeStateKey(`${ req.method }-${ req.url }`);

    }

    if (this.isServer) {

      return handler.handle(req).pipe(
        tap(event => {

          if (event instanceof HttpResponse) {

            this.state.set(key, event.body);

          }

        })
      );
    } else {

      // from cache
      if (this.state.hasKey(key)) {
        const data = this.state.get<any>(key, null);

        this.state.remove(key);

        return of(new HttpResponse({ body: data, status: 200 }));
      }

      return handler.handle(req);
    }
  }

}
