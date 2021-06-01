import { Middleware, ParameterizedContext } from 'koa';
import { Cipher } from './cipher';
import { Injectable } from 'injection-js';
import {
  AuthState,
  AuthStrategyOptions,
  AuthStrategyOptionsDefault,
  AUTH_KEY
} from './@auth-strategy';
import { Integral } from '@chamfer/util/dist/type-def';
import Cookies from 'cookies';


@Injectable()
export class AuthStrategyKoa {

  public cipher!: Cipher;
  private options!: Integral<AuthStrategyOptions>;

  constructor(secret: string, options?: AuthStrategyOptions) {
    this.cipher = new Cipher(secret);
    this.options = { ...new AuthStrategyOptionsDefault(), ...options }
  }

  public getMiddleware(): Middleware<{ auth: AuthState|null }> {

    return async (ctx, next) => {
      ctx.state.auth = this.resolveAuth(ctx);

      return next();
    }
  }

  public setAuthTokenAuto(cookies: Cookies, type: string, payload?: any, options?: Cookies.SetOption) {
    const token = this.cipher.signToken(payload);

    cookies.set(AUTH_KEY, `${ type } ${ token }`, { domain: this.options.domain, ...options });

    return token;
  }

  public deleteAuthToken(cookies: Cookies) {
    cookies.set(AUTH_KEY, null, { domain: this.options.domain });
  }

  private resolveAuth(ctx: ParameterizedContext): AuthState|null {
    const authorization = ctx.cookies.get(AUTH_KEY) || ctx.get(AUTH_KEY);

    if (typeof authorization !== 'string') {

      return null;
    }

    const [ type, credential ] = authorization.split(' ');
    let payload: any;

    try {

      payload = this.cipher.verifyToken(credential);

    } catch (error) {

      return null;
    }

    return { type: type.toLocaleLowerCase(), credential, payload }
  }

}
