import 'reflect-metadata';
import '../polyfills/node-fetch-http2-header';

import { config } from './config/api';
import Koa from 'koa';
import { LocalLogger, Logger } from '../lib/logger';
import { ReflectiveInjector } from 'injection-js';
import { Brackets, Connection, createConnection } from 'typeorm';
import { entities } from './models';
import { AuthStrategyKoa } from '../lib/auth-strategy/auth-strategy-koa';
import { GQLServer } from './graphql/server';
import koaCompress from 'koa-compress';
import { constants as zlibConstants } from 'zlib';
import { prepareToDie } from '../lib/process/prepare-to-die';
import { User } from './models/user.model';
import { userProviders, userRoles } from './models/user.def';


async function main() {
  process.title = config.name;

  const api = new Koa();
  const systemLog = new LocalLogger('api', config.systemLogPath);

  process.addListener('unhandledRejection', (reason, promise) => {
    const message = `${ config.name } slipped at ${ promise }\n${ reason }`;

    console.error(message);
    systemLog.log(message);
  });

  // create connection
  const connection = await (() => {
    if (!config.db) {

      throw new Error('database configuration required');
    }

    const { host, port, username, password, database } = config.db;

    return createConnection({
      type: 'mysql',
      host,
      port,
      username,
      password,
      database,
      entities,
      synchronize: true,
      charset: 'utf8mb4_unicode_ci'
    });
  })();

  // create auth strategy
  const authStrategy = new AuthStrategyKoa(config.apiSecret, { domain: config.domain });

  // create root injector
  const injector = ReflectiveInjector.resolveAndCreate([
    { provide: Connection, useValue: connection },
    { provide: AuthStrategyKoa, useValue: authStrategy },
    { provide: Logger, useValue: systemLog },
    GQLServer
  ]);

  // create master account
  if (config.masterAccount) {
    try {
      systemLog.log('create deus account...');
  
      const { email, username, password } = config.masterAccount;
  
      const user = await connection.createQueryBuilder(User, 'user')
                                   .setParameters({ email, username, false: 0 })
                                   .where('user.deleted = :false')
                                   .andWhere(new Brackets(subQuery => subQuery.where('user.email = :email OR user.username = :username')))
                                   .getOne();

      if (user) {
        systemLog.log(`account with ${ user.email === email ? email : username } already exists`);
      } else {
        const repo = connection.getRepository(User);
  
        const user = Object.assign(repo.create(), {
          email,
          username,
          password: authStrategy.cipher.SHAEncrypt(password),
          provider: userProviders.email,
          roles: [ userRoles.deus ]
        });
  
        await repo.save(user);
  
        systemLog.log(`successfully created deus account ${ email }`);
      }
    } catch (error) {
      systemLog.log(`failed to create master account ${ error }`);
    }
  }

  // apply middlewares
  api
  .use(
    koaCompress({
      threshold: '2kb',
      gzip: {
        flush: zlibConstants.Z_SYNC_FLUSH
      },
      br: {
        params: {
          [ zlibConstants.BROTLI_PARAM_MODE ]: zlibConstants.BROTLI_MODE_TEXT,
          [ zlibConstants.BROTLI_PARAM_QUALITY ]: 4
        }
      },
      deflate: false
    })
  )
  .use(
    injector.get(GQLServer).createMiddleware()
  );

  const service = api.listen(config.port, () => {
    const message = `${ config.name } service running at :${ config.port }`;

    console.log(message);
    systemLog.log(message);
  });

  prepareToDie(code => {
    const message = `${ config.name } has removed from :${ config.port } (exit code: ${ code })`;

    console.log(message);
    systemLog.log(message);
    service.close();
  });
}

try {
  await main();
} catch (error) {
  console.error(error);
}
