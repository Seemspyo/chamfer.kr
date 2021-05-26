import { resolve, dirname } from 'path';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';


export default env => {
  const
  dir = dirname(fileURLToPath(import.meta.url)),
  { version } = JSON.parse(readFileSync(resolve(dir, 'package.json')).toString('utf8')),
  mode = /development|production/i.test(env.mode) ? env.mode.toLowerCase() : 'development',
  prod = mode === 'production',
  outDir = resolve(dir, `dist/${ version }`);

  const plugins = []

  // Whether clean output directory
  if (env.clean !== 'false') {
    plugins.push(new CleanWebpackPlugin());
  }

  // Copy Definitions
  {
    const copyDefs = [
      { from: 'docker' }
    ]

    if (env.skipEnv !== 'true') {
      copyDefs.push({ from: 'src/environments', to: 'environments' });
    }

    plugins.push(new CopyPlugin({ patterns: copyDefs }));
  }

  return {
    target: 'node',
    mode,
    entry: {
      api: resolve(dir, 'src/api.ts'),
      ng: resolve(dir, 'src/ng.ts')
    },
    output: {
      filename: '[name].js',
      path: outDir
    },
    resolve: {
      extensions: [ '.ts', '.js', '.mjs' ],
      alias: {
        graphql$: resolve(dir, '../../node_modules/graphql/index.js'), // workaround for apollo server graphql dup module issue #https://github.com/apollographql/apollo-server/issues/4637
        isobject: resolve(dir, '../../node_modules/isobject/index.js') // graphql-upload has nested node_modules
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules\/(?!mysql)/
        }
      ]
    },
    experiments: {
      topLevelAwait: true
    },
    plugins,
    stats: prod ? 'errors-only' : 'normal',
    optimization: {
      minimize: false // mysql not compatible with minimizing https://stackoverflow.com/questions/55988989/error-received-packet-in-the-wrong-sequence-when-connect-to-serverless-auror
    }
  }
}
