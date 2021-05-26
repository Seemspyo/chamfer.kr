import { Inject, InjectionToken, Optional } from 'injection-js';
import {
  Args,
  ArgsType,
  Authorized,
  Ctx,
  Field,
  Mutation,
  Query,
  Resolver
} from 'type-graphql';
import { Brackets, Connection } from 'typeorm';
import { AuthStrategyKoa } from '../../../lib/auth-strategy/auth-strategy-koa';
import { GQLInvalidError, GQLPasswordInvalidError } from '../../errors';
import { allUsers, userProviders } from '../../models/user.def';
import { User } from '../../models/user.model';
import { GQLContext } from '../@graphql';


export const AUTH_RESOLVER_OPTIONS = new InjectionToken<AuthResolverOptions>('auth-resolver.options');

export interface AuthResolverOptions {
  domain?: string;
}

@ArgsType()
export class SignInInput {

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  username?: string;

  @Field()
  password!: string;
  
}

@Resolver()
export class AuthResolver {

  constructor(
    private auth: AuthStrategyKoa,
    private connection: Connection,
    @Optional() @Inject(AUTH_RESOLVER_OPTIONS) private options?: AuthResolverOptions
  ) { }

  @Query(returns => String)
  getPublicKey() {

    return this.auth.cipher.publicKey;
  }

  @Mutation(returns => String)
  async signIn(
    @Ctx() { koaContext }: GQLContext,
    @Args() { email, username, password }: SignInInput
  ) {
    if (!(email || username)) {

      throw new GQLInvalidError('email or username must provided');
    }

    const user = await this.connection.createQueryBuilder(User, 'user')
                                      .addSelect('user.password')
                                      .setParameters({ email, username, false: 0, provider: userProviders.email })
                                      .where('user.deleted = :false AND user.provider = :provider')
                                      .andWhere(new Brackets(subQuery => subQuery.where('user.email = :email OR user.username = :username')))
                                      .getOneOrFail();

    if (user.password !== this.auth.cipher.SHAEncrypt(password)) {

      throw new GQLPasswordInvalidError();
    }

    const token = this.auth.setAuthTokenAuto(koaContext.cookies, 'Bearer', { id: user.id }, this.options?.domain ? { domain: `.${ this.options.domain }` } : void 0);

    return token;
  }

  @Authorized(allUsers)
  @Mutation(returns => Boolean)
  async signOut(
    @Ctx() { koaContext }: GQLContext
  ) {
    this.auth.deleteAuthToken(koaContext.cookies);

    return true;
  }

}
