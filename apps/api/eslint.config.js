const node = require('@housing360/config/eslint/node');
const { apiLayering } = require('@housing360/config/eslint/boundaries');

module.exports = [...node, ...apiLayering({ srcDir: 'src' })];
