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
  // `body.dob.value`) plus generic nested equivalents for future payload shapes
  // (e.g. the intake wizard's family-member bulk-create array). mobile/email
  // are redacted too, extended here alongside ssn/dob per the client-intake-wizard
  // change — not automatic, so extend this list whenever a new PII field is added.
  // `description`/`notes` cover `case-workspace`'s free-text fields (Task
  // description, Case description, referral/disbursement notes) — same
  // rationale as meetingNotes/nextSteps: case-manager free text can contain
  // client-identifying detail. `caseManagerExitReason` is the same kind of
  // free text on an Exit assessment's Exit Details (`assessment-and-ce-workspace`);
  // `destinationType`/`destination` are short HUD codes, not free text, but
  // are redacted alongside it anyway since they're part of the same
  // Exit Details block and directly describe where a client went.
  redact: {
    paths: [
      'req.body.ssn.value',
      'req.body.dob.value',
      'req.body.mobile',
      'req.body.email',
      'req.body.meetingNotes',
      'req.body.nextSteps',
      'req.body.description',
      'req.body.notes',
      'req.body.clientSignature',
      'req.body.staffSignature',
      'req.body.caseManagerExitReason',
      'req.body.destinationType',
      'req.body.destination',
      'req.body.*.ssn.value',
      'req.body.*.dob.value',
      'req.body.*.mobile',
      'req.body.*.email',
      'req.body.members[*].ssn.value',
      'req.body.members[*].dob.value',
      'req.body.members[*].mobile',
      'req.body.members[*].email',
    ],
    censor: '[REDACTED]',
  },
});
