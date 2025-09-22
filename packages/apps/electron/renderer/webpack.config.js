const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isDevelopment = process.env.NODE_ENV !== 'production';
const isAnalyze = process.argv.includes('--analyze');

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
    filename: isDevelopment ? '[name].js' : '[name].[contenthash].js',
    chunkFilename: isDevelopment ? '[name].chunk.js' : '[name].[contenthash].chunk.js',
    clean: true
  },
  
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk for React and React-DOM
        react: {
          test: /[\/\\]node_modules[\/\\](react|react-dom)[\/\\]/,
          name: 'react',
          chunks: 'all',
          priority: 20
        },
        // Animation libraries chunk
        animations: {
          test: /[\/\\]node_modules[\/\\](framer-motion)[\/\\]/,
          name: 'animations',
          chunks: 'all',
          priority: 15
        },
        // Router chunk
        router: {
          test: /[\/\\]node_modules[\/\\](react-router|react-router-dom)[\/\\]/,
          name: 'router',
          chunks: 'all',
          priority: 10
        },
        // Other vendor libraries
        vendor: {
          test: /[\/\\]node_modules[\/\\]/,
          name: 'vendors',
          chunks: 'all',
          priority: 5,
          minChunks: 1
        },
        // Common code chunks
        common: {
          name: 'common',
          minChunks: 2,
          priority: -10,
          reuseExistingChunk: true
        }
      }
    },
    runtimeChunk: 'single',
    usedExports: true,
    sideEffects: false
  },
  
  performance: {
    hints: isDevelopment ? false : 'warning',
    maxAssetSize: 500000, // 500kb
    maxEntrypointSize: 500000, // 500kb
    assetFilter: function(assetFilename) {
      return !assetFilename.endsWith('.map');
    }
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
      inject: true,
      minify: isDevelopment ? false : {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    }),
    
    // Define global variables for Node.js compatibility in Electron renderer
    new webpack.DefinePlugin({
      global: 'globalThis',
      'process.env.ELECTRON_ENV': JSON.stringify('renderer'),
      'process.env.APP_VERSION': JSON.stringify(require('../../../../package.json').version)
    }),
    
    // Provide global polyfills
    new webpack.ProvidePlugin({
      global: 'globalThis',
    }),
    
    // Bundle analyzer for production builds
    ...(isAnalyze ? [new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html',
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json'
    })] : [])
  ],
  
  // Externalize Node.js modules only in production (for actual Electron build)
  externals: isDevelopment ? {} : {
    'electron': 'commonjs electron',
    'fs': 'commonjs fs',
    'path': 'commonjs path',
    'os': 'commonjs os',
  }
};
