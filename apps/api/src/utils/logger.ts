import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  transport:
    env.nodeEnv === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true } },
  // SSN/DOB are disclosure fields (`{ status, value }`) submitted in intake
  // (POST) and update (PATCH) request bodies — never let pino-http's
  // automatic request logging (see middlewares/requestLogger.ts) print the
  // raw value. Covers the flat intake/update body shape (`body.ssn.value`,
  // `body.dob.value`) plus generic nested equivalents for future payload shapes.
  redact: {
    paths: [
      'req.body.ssn.value',
      'req.body.dob.value',
      'req.body.*.ssn.value',
      'req.body.*.dob.value',
    ],
    censor: '[REDACTED]',
  },
});
