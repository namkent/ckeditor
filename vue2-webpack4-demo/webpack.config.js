const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const resolve = (dir) => {
  return path.join(__dirname, '.', dir);
};

// region [Config block - Common for both Production and Development]
const legoCommonConfig = (env, webpackOption) => {
  let mode = webpackOption.mode;
  let isNotProduction = (mode !== 'production');

  return {
    name: 'lego',
    entry: {
      admin: resolve('src/main.js'),
    },
    output: {
      path: resolve('dist'),
      filename: 'build.[name].[hash].js',
      publicPath: '/'
    },
    resolve: {
      extensions: ['.js', '.vue', '.json', '.scss'],
      alias: {
        'vue$': 'vue/dist/vue.esm.js',
        '@': resolve('src'),
        '@style': resolve('src/style'),
      }
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              scss: [
                'vue-style-loader',
                { loader: 'css-loader', options: { sourceMap: isNotProduction } },
                {
                  loader: 'sass-loader',
                  options: {
                    // Automatically prepend enterprise token and reset SCSS into every Vue style block
                    data: `@import "@style/customConfig/customToken.scss";@import '@/uidevOverride/styles/starterTokenEntry.scss';`,
                    sourceMap: isNotProduction
                  }
                }
              ]
            }
          }
        },
        {
          test: /\.scss$/,
          loaders: [
            'style-loader',
            { loader: 'css-loader', options: { sourceMap: isNotProduction } },
            { loader: 'sass-loader', options: { sourceMap: isNotProduction } },
          ]
        },
        {
          test: /\.css$/,
          loaders: ['vue-style-loader', 'css-loader']
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [
            resolve('src')
          ],
          exclude: [
            /node_modules/
          ],
          options: {
            compact: false,
            cacheDirectory: true,
          }
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico|svg|mp4)$/,
          loader: 'file-loader',
          options: { name: 'asset/media/[name].[hash:8].[ext]' }
        },
        {
          test: /\.(woff2?|eot|ttf|otf)?$/,
          loader: 'file-loader',
          options: { name: 'asset/fonts/[name].[ext]' }
        }
      ]
    },
    plugins: [
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        'process.env.BUILD_LABEL': JSON.stringify(env.label || '')
      })
    ]
  };
};
// endregion

// region [Config block - Production]
const legoProductionConfig = () => {
  return {
    plugins: [
      new HtmlWebpackPlugin({
        template: resolve('public/index.html'),
        filename: 'index.html',
        inject: true,
        chunks: ['admin'],
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true
        },
      })
    ]
  };
};
// endregion

// region [Config block - Development]
const legoDevelopmentConfig = () => {
  return {
    plugins: [
      new HtmlWebpackPlugin({
        template: resolve('public/index.html'),
        filename: 'index.html',
        inject: true,
        chunks: ['admin'],
      }),
    ],
    devServer: {
      hot: true,
      historyApiFallback: true,
      host: '127.0.0.1',
      port: 9095,
      open: false,
      overlay: {
        warnings: false,
        errors: true
      }
    },
    devtool: 'source-map'
  };
};
// endregion

// region [Assemble config block]
module.exports = (env = {}, options = {}) => {
  const mode = options.mode || 'development';
  let rtn = { ...legoCommonConfig(env, { ...options, mode }) };

  if (mode === 'development') {
    let developmentConfig = legoDevelopmentConfig();
    rtn.plugins = [...rtn.plugins, ...developmentConfig.plugins];
    rtn.devServer = developmentConfig.devServer;
    rtn.devtool = developmentConfig.devtool;
  }

  if (mode === 'production') {
    let productionConfig = legoProductionConfig();
    rtn.plugins = [...rtn.plugins, ...productionConfig.plugins];
  }

  console.log(`Build Mode: ${mode}`);
  return rtn;
};
// endregion
