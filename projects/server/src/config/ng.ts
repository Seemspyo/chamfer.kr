import { resolve } from 'path';
import { config as resolverConfig } from 'dotenv';


resolverConfig({ path: resolve(__dirname, 'environments/common.env') });
resolverConfig({ path: resolve(__dirname, 'environments/ng.env') });

const {

  DOMAIN = 'chamfer.kr',

  NAME = 'chamfer-ng',
  PORT = '2400',
  SYSTEM_LOG = 'log/ng.log',

  DEV_MODE = 'true',

  NG_ROOT = '/usr/src/ng/web',
  NG_INDEX = 'index.html',
  NG_SERVER_BUNDLE = 'main.js',
  NG_SERVER_MODULE = 'AppServerModule',
  NG_STATIC_EXTENSIONS = 'js,css,txt,json,ico,png,jpg,jpeg,gif,webp',

  NG_SUBDOMAINS = null

} = process.env;

export const config = {

  domain: DOMAIN,

  name: NAME,
  port: Number.parseInt(PORT),
  systemLogPath: SYSTEM_LOG,

  devMode: DEV_MODE === 'true',

  ng: {
    root: NG_ROOT,
    index: NG_INDEX,
    serverBundle: NG_SERVER_BUNDLE,
    serverModule: NG_SERVER_MODULE,
    staticExtensions: NG_STATIC_EXTENSIONS.toLowerCase().split(',').map(ext => ext.trim()),
    subdomains: typeof NG_SUBDOMAINS === 'string' ? NG_SUBDOMAINS.split(',').map(ext => ext.trim()) : null
  }

}
