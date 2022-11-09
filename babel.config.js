module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: false,
      /*targets: {
        chrome: '42',
      },
      debug: true,
      useBuiltIns: 'entry',*/
    }],
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-syntax-dynamic-import',
  ],
};
