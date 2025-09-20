const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: './src/index.tsx',
  target: 'electron-renderer',
  devtool: isDevelopment ? 'source-map' : false,
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, '../../../core'),
      '@infrastructure': path.resolve(__dirname, '../../../infrastructure'),
      '@electron-shared': path.resolve(__dirname, '../shared'),
    }
  },
  
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource'
      }
    ]
  },
  
  output: {
    path: path.resolve(__dirname, '../../../../dist/electron/renderer'),
    filename: 'bundle.js',
    clean: true
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: true
    })
  ],
  
  devServer: {
    port: 3000,
    hot: true,
    compress: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public'),
    }
  },
  
  externals: {
    // Exclude electron from bundle
    electron: 'commonjs2 electron'
  }
};