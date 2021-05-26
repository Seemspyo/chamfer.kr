import 'reflect-metadata';

import Koa from 'koa';
import { config } from './config/ng';
import { LocalLogger, Logger } from '../lib/logger';
import { ReflectiveInjector } from 'injection-js';
import koaCompress from 'koa-compress';
import { constants as zlibConstants } from 'zlib';
import { prepareToDie } from '../lib/process/prepare-to-die';
import { AngularIvyServerRouter, ANGULAR_SERVER_CONFIG } from './routers/ng-server.router';


async function main() {
  process.title = config.name;

  const ng = new Koa();
  const systemLog = new LocalLogger('ng', config.systemLogPath);

  process.addListener('unhandledRejection', (reason, promise) => {
    const message = `${ config.name } slipped at ${ promise }\n${ reason }`;

    console.error(message);
    systemLog.log(message);
  });

  const injector = ReflectiveInjector.resolveAndCreate([
    { provide: ANGULAR_SERVER_CONFIG, useValue: config.ng },
    AngularIvyServerRouter
  ]);

  const ngRouter: AngularIvyServerRouter = injector.get(AngularIvyServerRouter);

  ng
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
  .use(ngRouter.allowedMethods())
  .use(ngRouter.routes());

  const service = ng.listen(config.port, () => {
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
