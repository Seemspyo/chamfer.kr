import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { User, SignInInput } from '@chamfer/server';
import { GQLClient } from 'common/graphql/client';
import { HTTP_STATE_EXPLICIT } from 'common/http-transfer';
import gql from 'graphql-tag';
import { BehaviorSubject } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { USER_FIELDS } from './user.api';


/**
 * currerntly `initialNavigation: 'enabled'`, which required for angular ssr,
 * invokes Router Guards before `APP_INITIALIZER` running.
 * for now, use `CanActivate` on root router instead.
 * https://github.com/angular/universal/issues/1623
 */
@Injectable()
export class AuthAPI implements CanActivate {

  private user: User|null = null;

  get initialized() {

    return this._initialized;
  }
  private _initialized = false;

  get me() {

    return this.user;
  }

  get authorized() {

    return Boolean(this.user);
  }

  public authState!: BehaviorSubject<boolean>;

  constructor(
    private graphql: GQLClient
  ) { }

  async canActivate() {
    if (this.initialized) {
      await this.init();
    }

    return true;
  }

  public async init() {
    if (this.initialized) return;

    await this.detectCurrentUser().toPromise();

    this._initialized = true;
    this.authState = new BehaviorSubject<boolean>(this.authorized);
  }

  public signIn(input: SignInInput) {
    const query = gql`
      mutation ($email: String, $username: String, $password: String!) {
        token: signIn(email: $email, username: $username, password: $password)
      }
    `;
    
    return this.graphql.query<{ token: string }>(query, input).pipe(
      concatMap(res => {

        return this.detectCurrentUser().pipe(
          map(() => {
            this.updateAuthState();

            return res.token;
          })
        );
      })
    );
  }

  public signOut() {
    const query = gql`
      mutation {
        signOut
      }
    `;

    return this.graphql.query<{ signOut: boolean }>(query).pipe(
      map(res => {
        this.user = null;
        this.updateAuthState();

        return res.signOut;
      })
    );
  }

  private detectCurrentUser() {
    const query = gql`
      query {
        me {
          ${ USER_FIELDS.join('\n') }
        }
      }
    `;
    const params = { [ HTTP_STATE_EXPLICIT ]: 'me' }

    return this.graphql.query<{ me: User|null }>(query, void 0, { params }).pipe(
      map(res => {

        return this.user = res.me;
      })
    );
  }

  private updateAuthState() {
    this.authState.next(this.authorized);
  }

}
