export const AUTH_KEY = 'Authorization';

export interface AuthState<T = undefined> {
  type: string;
  credential: string;
  payload: T;
}

export class AuthStrategyOptionsDefault {

  domain = 'localhost';

}

export type AuthStrategyOptions = Partial<AuthStrategyOptionsDefault>;
