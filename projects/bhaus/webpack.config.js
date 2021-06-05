import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';


export default env => {
  const
  dir = dirname(fileURLToPath(import.meta.url)),
  mode = /development|production/i.test(env.mode) ? env.mode.toLowerCase() : 'development',
  production = mode === 'production';

  return {
    mode,
    entry: {
      main: resolve(dir, 'src/main.ts')
    },
    output: {
      path: resolve(dir, 'dist'),
      filename: production ? '[name].[contenthash].js' : '[name].js'
    },
    resolve: {
      extensions: [ '.ts', '.js', '.mjs' ],
      alias: {
        src: resolve(dir, 'src')
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: '/node_modules/'
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader'
          ]
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new CopyPlugin({ patterns: [ { from: 'src/assets', to: 'assets' } ] }),
      new MiniCssExtractPlugin({ filename: production ? 'styles.[contenthash].css' : 'styles.css' }),
      new HtmlWebpackPlugin({ template: 'src/index.html', inject: 'body' })
    ],
    stats: production ? 'errors-only' : 'normal'
  }
}
