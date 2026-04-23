const path = require('path')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  // Webpack 5 + antd: suppress harmless "version" re-export warning from antd bundle
  ignoreWarnings: [
    { module: /node_modules[\\/]antd[\\/]/, message: /version/ }
  ],
  entry: './main/index.js',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, "./dist"),
    publicPath: './dist/',
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
          },
        ],
      },
      {
        test: /\.less$/,
        include: path.resolve(__dirname, './main'),
        use: [{
          loader: 'style-loader'
        }, {
          loader: 'css-loader?',
        }, {
          loader: 'less-loader?'
        }],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg?$/,
        use: [{
          loader: 'svg-loader',
        }]
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        use: {
          loader: 'file-loader',
          options: {
            esModule: false
          }
        }
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource'
      }]
  },
  resolve: {
    extensions: [".js", ".json"],
  },
  devServer: {
    contentBase: __dirname,
    compress: true,
    port: 9001,
    host: 'localhost',
    hot: true,
    // 避免浏览器长期使用磁盘上旧的 dist/bundle.js，表现为改了源码仍白屏/旧报错
    headers: { 'Cache-Control': 'no-store' },
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ["json", "javascript"],
    }),
    // new BundleAnalyzerPlugin()
  ]
}