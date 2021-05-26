import {
  Injector,
  Optional,
  Provider,
  ReflectiveInjector
} from 'injection-js';
import { Middleware } from 'koa';
import { AuthStrategyKoa } from '../../lib/auth-strategy/auth-strategy-koa';
import { Logger } from '../../lib/logger';
import {
  AuthChecker,
  buildSchemaSync,
  ClassType,
  ForbiddenError
} from 'type-graphql';
import { GQLContext } from './@graphql';
import { GraphQLError, GraphQLSchema } from 'graphql';
import {
  ApolloServer,
  AuthenticationError,
  Config as ApolloConfig
} from 'apollo-server-koa';
import { config } from '../config/api';
import { Connection, EntityNotFoundError } from 'typeorm';
import { User } from '../models/user.model';
import { AuthState } from '../../lib/auth-strategy';
import {
  GQLInternalError,
  GQLNotFoundError,
  GQLPermissionError,
  isQueryError
} from '../errors';
import compose from 'koa-compose';
import { BaseResolver } from './resolvers/base.resolver';
import { AuthResolver, AUTH_RESOLVER_OPTIONS } from './resolvers/auth.resolver';
import { S3 } from 'aws-sdk';
import { S3_UPLOAD_CONFIGS, UploadResolver } from './resolvers/upload.resolver';
import { graphqlUploadKoa } from 'graphql-upload';
import { BannerResolver } from './resolvers/banner.resolver';
import { ArticleResolver } from './resolvers/article.resolver';
import { ProductResolver } from './resolvers/product.resolver';
import { UserResolver } from './resolvers/user.resolver';
import { JSONDataResolver } from './resolvers/json.resolver';


export class GQLServer {

  constructor(
    private auth: AuthStrategyKoa,
    private connection: Connection,
    private injector: Injector,
    @Optional() private logger?: Logger
  ) { }

  public createMiddleware() {
    const schema = this.createSchemaSync([
      BaseResolver,
      AuthResolver,
      UserResolver,
      BannerResolver,
      ArticleResolver,
      ProductResolver,
      UploadResolver,
      JSONDataResolver
    ]);
    const graphql = this.createGQLServer(schema);

    return compose([
      this.auth.getMiddleware(),
      this.createUserResolver(),
      graphqlUploadKoa({ maxFieldSize: 1e8 }),
      graphql.getMiddleware({
        path: config.gqlPath,
        cors: {
          origin: Array.isArray(config.whiteList) ? ctx => {
            const origin = ctx.request.get('origin');

            if (!config.whiteList.includes(origin)) {

              ctx.throw(401, 'NOT_ALLOWED');
            }

            return origin;
          } : ctx => ctx.request.get('origin'),
          allowMethods: 'GET,HEAD,OPTIONS,POST',
          allowHeaders: [ 'Authorization', 'Content-Type' ],
          credentials: true
        }
      })
    ]);
  }

  private createSchemaSync(resolvers: [ ClassType, ...ClassType[] ]) {
    const authChecker: AuthChecker<GQLContext> = ({ context: { authType, user } }, canPass) => {

      switch (authType) {

        case 'bearer': {

          return canPass.includes('*') || user!.roles.some(role => canPass.includes(role));
        }

        default: {

          return canPass.includes('*');
        }

      }
    }

    const providers: Provider[] = [
      { provide: AUTH_RESOLVER_OPTIONS, useValue: { domain: config.domain } }
    ]

    if (config.s3) {
      const { accessKey, secretKey, region, bucket, originAlt } = config.s3;

      providers.push(
        {
          provide: S3,
          useValue: new S3({
            credentials: {
              accessKeyId: accessKey,
              secretAccessKey: secretKey
            },
            region
          })
        },
        { provide: S3_UPLOAD_CONFIGS, useValue: { bucket, originAlt } }
      );
    }

    return buildSchemaSync({
      resolvers,
      authChecker,
      container: ReflectiveInjector.resolveAndCreate([ ...resolvers, ...providers ], this.injector)
    });
  }

  private createGQLServer(schema: GraphQLSchema) {
    const buildContext: ApolloConfig['context'] = ({ ctx }): GQLContext => {
      const { type, user } = ctx.state;

      return {
        authType: type,
        user,
        koaContext: ctx
      }
    }

    return new ApolloServer({
      schema,
      context: buildContext,
      debug: config.devMode,
      uploads: false,
      formatError: error => this.handleGQLError(error)
    });
  }

  private handleGQLError(error: GraphQLError) {
    const { originalError } = error;

    if (isQueryError(originalError)) {
      const { message, code } = originalError;

      this.logger?.log(`${ code }: ${ message }`);

      return new GQLInternalError(message);
    }

    if (originalError instanceof AuthenticationError) {

      return new GQLPermissionError();
    }

    if (originalError instanceof ForbiddenError) {

      return new GQLPermissionError();
    }

    if (originalError instanceof EntityNotFoundError) {

      return new GQLNotFoundError();
    }

    return error;
  }

  private createUserResolver(): Middleware {

    return async (ctx, next) => {
      const auth: AuthState<User> = ctx.state.auth;

      if (!auth) {

        return next();
      }

      if (auth.type === 'bearer') {
        const user = await this.connection
                    .getRepository(User)
                    .createQueryBuilder('user')
                    .setParameters({ false: 0, id: auth.payload.id })
                    .where('user.deleted = :false AND user.id = :id')
                    .getOne();

        if (!user) {

          ctx.throw(401, 'invalid authorization token');
        }

        ctx.state.type = auth.type;
        ctx.state.user = user!;
      }

      return next();
    }
  }

}
