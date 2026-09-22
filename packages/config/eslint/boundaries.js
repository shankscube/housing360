/**
 * Enforces the routes -> controllers -> services -> models layering for
 * an Express API: only services/models may import from models/, and only
 * the shared responder + error middleware may send a raw HTTP response.
 */
function apiLayering({ srcDir = 'src' } = {}) {
  return [
    {
      files: [`${srcDir}/**/*.{ts,js}`],
      ignores: [`${srcDir}/services/**`, `${srcDir}/models/**`],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [`**/models/*`, `**/models`, `*/models/*`],
                message:
                  'Only services (or models themselves) may import from models/. Go through a service instead.',
              },
            ],
          },
        ],
      },
    },
    {
      files: [`${srcDir}/**/*.{ts,js}`],
      ignores: [`${srcDir}/utils/responder.*`, `${srcDir}/middlewares/errorHandler.*`],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "CallExpression[callee.object.name='res'][callee.property.name=/^(json|send|end)$/]",
            message:
              'Do not call res.json/res.send/res.end directly. Use the shared responder utility (utils/responder) so every endpoint returns the same shape.',
          },
        ],
      },
    },
  ];
}

module.exports = { apiLayering };
