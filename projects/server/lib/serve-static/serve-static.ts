import { parse, resolve } from 'path';
import { existsSync } from 'fs';
import { Middleware } from 'koa';
import send from 'koa-send';


export type ServeOptions = send.SendOptions;

export function serveStatic(root: string, extensions?: string[], options?: ServeOptions): Middleware {
  const
  methods = /get|head/i,
  filter = new RegExp(`.*\.${ extensions?.length ? extensions.join('|') : '\w{1,}' }`);

  return async (ctx, next) => {
    if (methods.test(ctx.method) && filter.test(ctx.path)) {
      const
      path = ctx.path.substring(parse(ctx.path).root.length),
      absolutePath = resolve(root, path);

      if (existsSync(absolutePath)) {

        return send(ctx, absolutePath, { ...options, root: '/', brotli: false, gzip: false });
      } else {

        ctx.throw(404, 'NOT_FOUND');
      }
    }

    return next();
  }
}
