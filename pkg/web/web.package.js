const webpack = require('webpack');

module.exports = {
  // 其他 webpack 配置...
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/")  // 添加 buffer polyfill
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],  // 自动提供 Buffer
    }),
  ],
};
