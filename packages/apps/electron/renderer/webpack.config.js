const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: './src/index.tsx',
  target: isDevelopment ? 'web' : 'electron-renderer', // Use web for dev server, electron-renderer for production
  devtool: isDevelopment ? 'source-map' : false,
  
  node: {
    __dirname: false,
    __filename: false
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
  
  devServer: {
    port: 3000,
    hot: true,
    compress: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public'),
    }
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    fallback: {
      "events": require.resolve("events"),
      "global": false
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, '../../../core'),
      '@infrastructure': path.resolve(__dirname, '../../../infrastructure'),
      '@electron-shared': path.resolve(__dirname, '../shared'),
      // Force events to be bundled instead of treated as external
      'events': require.resolve('events')
    }
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: true
    }),
    
    // Define global variables for Node.js compatibility in Electron renderer
    new webpack.DefinePlugin({
      global: 'globalThis',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    
    // Provide global polyfills
    new webpack.ProvidePlugin({
      global: 'globalThis',
    }),
  ],
  
  // Externalize Node.js modules only in production (for actual Electron build)
  externals: isDevelopment ? {} : {
    'electron': 'commonjs electron',
    'fs': 'commonjs fs',
    'path': 'commonjs path',
    'os': 'commonjs os',
  }
};
