module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    jest: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': ['error', { allow: ['error'] }],
  },
  overrides: [
    {
      files: '*',
      rules: {
        'no-plusplus': 'off',
        'no-continue': 'off',
      },
    },
  ],
};
