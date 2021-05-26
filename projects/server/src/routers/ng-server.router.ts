import Router from '@koa/router';
import { existsSync, readFileSync } from 'fs';
import { Inject, InjectionToken } from 'injection-js';
import { resolve } from 'path';
import { serveStatic } from '../../lib/serve-static';
import { renderModule } from '@angular/platform-server';
import { ParameterizedContext } from 'koa';


export const ANGULAR_SERVER_CONFIG = new InjectionToken<AngularServerConfig>('angular-server.config');

export interface AngularServerConfig {
  root: string;
  index: string;
  serverBundle: string;
  serverModule: string;
  staticExtensions: string[];
  subdomains: string[] | null;
}

interface AngularIvyServerModule {

  renderModule: typeof renderModule;
  KOA_CONTEXT?: InjectionToken<ParameterizedContext>;
  [ key: string ]: any;

}

declare const __non_webpack_require__: NodeRequire;

function importOnce(path: string) {
  const module = __non_webpack_require__(path);

  delete __non_webpack_require__.cache[__non_webpack_require__.resolve(path)];

  return module;
}

export class AngularIvyServerRouter extends Router {

  constructor(
    @Inject(ANGULAR_SERVER_CONFIG) private config: AngularServerConfig
  ) {
    super();

    this.enableNgServerRouter();
  }

  private enableNgServerRouter() {
    const {
      root,
      index,
      serverBundle,
      serverModule,
      staticExtensions,
      subdomains
    } = this.config;

    const withSubdomain = Boolean(subdomains?.length);

    // root should be aliased with subdomain enabled because they should acts like a virtual hosts.
    let rootAlias = '';

    if (withSubdomain) {

      rootAlias = 'root';

      const serverMap = new Map(subdomains!.map(sub => {

        return [ sub, serveStatic(resolve(root, sub), staticExtensions) ];
      }));

      this.use(async (ctx, next) => {
        const serve = serverMap.get(ctx.subdomains.join('.'));

        if (serve) {

          return serve(ctx, next);
        }

        return next();
      });

    }

    this
    .use(serveStatic(resolve(root, rootAlias), staticExtensions))
    .get(/.*/, async (ctx, next) => {
      const
      dir = ctx.subdomains.join('.') || rootAlias,
      path = ctx.path.startsWith('/') ? ctx.path.replace('/', '') : ctx.path;

      // first, find index file from subdirectory
      const indexPath = resolve(root, dir, path, index);

      let
      indexHTML: string|null = null,
      serverBundlePath: string|null = null;

      if (existsSync(indexPath)) {

        indexHTML = readFileSync(indexPath).toString('utf8');
        serverBundlePath = resolve(root, dir, path, serverBundle);

      } else { // try fallback to root

        const rootIndexPath = resolve(root, dir, index);

        if (existsSync(rootIndexPath)) {

          indexHTML = readFileSync(rootIndexPath).toString('utf8');
          serverBundlePath = resolve(root, dir, serverBundle);

        }

      }

      if (indexHTML) {

        // render Ivy module
        if (serverBundlePath && existsSync(serverBundlePath)) {
          const bundle: AngularIvyServerModule = importOnce(serverBundlePath);

          indexHTML = await bundle.renderModule(bundle[serverModule], {
            document: indexHTML,
            url: ctx.url,
            extraProviders: bundle.KOA_CONTEXT && [
              {
                provide: bundle.KOA_CONTEXT,
                useValue: ctx
              }
            ]
          });

        }

        ctx.body = indexHTML;

        return;
      }

      return next();
    });
  }

}
