import { resolve } from 'path';
import { config as resolveConfig } from 'dotenv';
import { ifAllExists } from '@chamfer/util/dist/if-all-exists';


resolveConfig({ path: resolve(__dirname, 'environments/common.env') });
resolveConfig({ path: resolve(__dirname, 'environments/api.env') });

const {

  DEV_MODE = 'true',
  APP_SECRET = 'chamfer.kr',
  HOST = 'localhost',
  DOMAIN = 'chamfer.kr',

  WHITE_LIST = '*',
  NAME = 'chamfer-api',
  PORT = '2800',
  SYSTEM_LOG = 'log/chamfer_api.log',
  API_SECRET = 'dev',
  GRAPHQL_PATH = '/graphql',

  MYSQL_DATABASE,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_HOST = 'chamfer_db',
  MYSQL_PORT = '3306',

  DEUS_EMAIL,
  DEUS_USERNAME,
  DEUS_PASSWORD,

  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_REGION = 'ap-northeast-2',
  AWS_BUCKET,
  AWS_ORIGIN_ALT

} = process.env;

export const config = {

  devMode: DEV_MODE === 'true',
  appSecret: APP_SECRET,
  host: HOST,

  whiteList: WHITE_LIST === '*' ? WHITE_LIST : WHITE_LIST.split(','),
  domain: DOMAIN,

  name: NAME,
  port: parseInt(PORT),
  systemLogPath: SYSTEM_LOG,
  apiSecret: API_SECRET,
  gqlPath: GRAPHQL_PATH,

  db: ifAllExists([ MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD ], {
    database: MYSQL_DATABASE!,
    username: MYSQL_USER!,
    password: MYSQL_PASSWORD!,
    host: MYSQL_HOST,
    port: parseInt(MYSQL_PORT)
  }),

  masterAccount: ifAllExists([ DEUS_EMAIL, DEUS_USERNAME, DEUS_PASSWORD ], {
    email: DEUS_EMAIL!,
    username: DEUS_USERNAME!,
    password: DEUS_PASSWORD!
  }),

  s3: ifAllExists([ AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_BUCKET ], {
    accessKey: AWS_ACCESS_KEY!,
    secretKey: AWS_SECRET_KEY!,
    region: AWS_REGION,
    bucket: AWS_BUCKET!,
    originAlt: AWS_ORIGIN_ALT
  })

}
