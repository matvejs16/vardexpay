const path = require('path');

module.exports = {
  entry: './src/index.ts', // Замените путь на путь к вашему основному файлу TypeScript
  mode: 'production',
  target: 'node',
  externals: ['node_modules'],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    chunkFilename: 'chunks/[name].chunk.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
        "@src": path.resolve(__dirname, 'src'),
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};