import { isPlatformServer } from '@angular/common';
import {
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import {
  Inject,
  Injectable,
  Optional,
  PLATFORM_ID
} from '@angular/core';
import { GraphQLError } from 'graphql';
import { ParameterizedContext } from 'koa';
import { KOA_CONTEXT } from './@auth-strategy';


export const AUTH_IGNORE_KEY = 'Θauth-ignore';

export class AuthStrategyConfig {
  origin = '';
  path = '/graphql';
  useAuthKey = 'Authorization';
}

export interface BasicAuthResponse {
  data: { token: string; } | null;
  errors?: GraphQLError[];
}

// This Auth strategy handles Server-side rendering with Angular Universal.
@Injectable()
export class AuthStrategy implements HttpInterceptor {

  private isServer!: boolean;
  private config!: AuthStrategyConfig;

  private authorization?: string;

  constructor(
    @Inject(PLATFORM_ID) platformID: Object,
    @Optional() config?: AuthStrategyConfig,
    @Optional() @Inject(KOA_CONTEXT) ctx?: ParameterizedContext
  ) {
    this.isServer = isPlatformServer(platformID);
    this.config = { ...new AuthStrategyConfig(), ...config }
    this.authorization = ctx?.cookies.get(this.config.useAuthKey) || ctx?.get(this.config.useAuthKey);
  }

  intercept(req: HttpRequest<any>, handler: HttpHandler) {
    if (req.params.has(AUTH_IGNORE_KEY)) {

      return handler.handle(req.clone({ params: req.params.delete(AUTH_IGNORE_KEY) }));
    }

    if (this.isServer) {
      const
      url = new URL(req.url),
      { origin, path } = this.config;

      if (this.authorization && (origin ? origin.match(url.origin) : true) && path === url.pathname) {
        req = req.clone({
          headers: req.headers.append(this.config.useAuthKey, this.authorization!)
        });
      }
    } else {
      req = req.clone({ withCredentials: true });
    }

    return handler.handle(req);
  }

}
