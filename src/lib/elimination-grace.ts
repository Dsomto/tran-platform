// How long an eliminated intern (failed a stage, or did not submit) keeps
// read-only access to their dashboard after the decision, before login is
// blocked and the account is purged. The login gate (auth.ts), the purge cron
// (api/cron/purge-eliminated), and the result email's wind-down date all read
// this one value so they can never drift apart.
export const ELIMINATION_GRACE_DAYS = 7;
export const ELIMINATION_GRACE_MS = ELIMINATION_GRACE_DAYS * 24 * 60 * 60 * 1000;
