const assert = require('node:assert/strict');
const crypto = require('crypto');
const { after, test } = require('node:test');
const request = require('supertest');
const app = require('../server');
const pool = require('../db');

const run = crypto.randomUUID().slice(0, 8);
const password = 'StrongPassword123';
let admin; let analyst; let reviewer; let other; let assessment;

function headers(identity) { return { Authorization: `Bearer ${identity.token}`, 'X-Organization-ID': String(identity.organization.id) }; }
async function registerBootstrap(label) {
  const response = await request(app).post('/api/auth/register').send({ email: `${label}-${run}@example.test`, password, name: `${label} user`, organizationName: `${label} organization ${run}` }).expect(201);
  return { token: response.body.token, user: response.body.user, organization: response.body.organizations[0] };
}
async function inviteAndRegister(role, label) {
  const invite = await request(app).post('/api/research/invitations').set(headers(admin)).send({ email: `${label}-${run}@example.test`, role }).expect(201);
  const response = await request(app).post('/api/auth/register').send({ email: `${label}-${run}@example.test`, password, name: `${label} user`, invitationToken: invite.body.invitation.token }).expect(201);
  return { token: response.body.token, user: response.body.user, organization: response.body.organizations[0] };
}
function assessmentBody(label) {
  return { idempotencyKey: `${label}-${run}-12345678`, incumbentName: 'Legacy Suite', challengerName: `Focused Challenger ${label}`, category: 'Support', hypothesis: 'The challenger should reduce annual operating cost while preserving reviewed service levels.', annualIncumbentCostCents: 12_000_000, annualChallengerCostCents: 6_000_000, migrationCostCents: 3_000_000, annualHoursSaved: 1000, loadedHourlyCostCents: 10_000, confidenceBps: 8000 };
}

after(async () => { await pool.end(); });

test('bootstrap identity, invitation roles, short-lived tenant context, and login work', async () => {
  admin = await registerBootstrap('admin');
  assert.equal(admin.organization.role, 'ADMIN');
  analyst = await inviteAndRegister('ANALYST', 'analyst');
  reviewer = await inviteAndRegister('REVIEWER', 'reviewer');
  other = await registerBootstrap('other');
  assert.equal(analyst.organization.id, admin.organization.id);
  assert.equal(reviewer.organization.role, 'REVIEWER');
  const login = await request(app).post('/api/auth/login').send({ email: `analyst-${run}@example.test`, password }).expect(200);
  assert.equal(login.body.organizations[0].id, admin.organization.id);
  await request(app).get('/api/research/assessments').set('Authorization', `Bearer ${analyst.token}`).expect(400).expect((response) => assert.equal(response.body.code, 'ORGANIZATION_REQUIRED'));
  await request(app).post('/api/auth/login').send({ email: `analyst-${run}@example.test`, password: 'wrong-password' }).expect(401).expect((response) => assert.equal(response.body.error, 'Invalid credentials'));
});

test('assessment creation is validated, persistent, and idempotent', async () => {
  const input = assessmentBody('primary');
  const created = await request(app).post('/api/research/assessments').set(headers(analyst)).send(input).expect(201);
  assessment = created.body.assessment;
  assert.equal(assessment.state, 'DRAFT');
  const replay = await request(app).post('/api/research/assessments').set(headers(analyst)).send(input).expect(200);
  assert.equal(replay.body.assessment.id, assessment.id);
  assert.equal(replay.body.duplicate, true);
  await request(app).post('/api/research/assessments').set(headers(analyst)).send({ ...input, challengerName: 'Different challenger' }).expect(409).expect((response) => assert.equal(response.body.code, 'IDEMPOTENCY_CONFLICT'));
  await request(app).post('/api/research/assessments').set(headers(analyst)).send({ ...assessmentBody('invalid'), hypothesis: 'too short' }).expect(422);
});

test('tenant scope prevents cross-organization access', async () => {
  await request(app).get(`/api/research/assessments/${assessment.id}`).set(headers(other)).expect(404).expect((response) => assert.equal(response.body.code, 'ASSESSMENT_NOT_FOUND'));
});

test('evidence uses optimistic locking, HTTPS validation, hashing, and duplicate protection', async () => {
  const evidence = { expectedVersion: assessment.version, evidenceKind: 'CASE_STUDY', sourceTitle: 'Measured support migration', publisher: 'Example Research', sourceUrl: 'https://research.example.test/case-study', observedAt: '2026-01-15', excerpt: 'The reviewed contract and staffing baseline support the stated cost and time assumptions.' };
  await request(app).post(`/api/research/assessments/${assessment.id}/evidence`).set(headers(analyst)).send({ ...evidence, expectedVersion: 99 }).expect(409).expect((response) => assert.equal(response.body.code, 'VERSION_CONFLICT'));
  await request(app).post(`/api/research/assessments/${assessment.id}/evidence`).set(headers(analyst)).send({ ...evidence, sourceUrl: 'http://insecure.example.test' }).expect(422);
  await request(app).post(`/api/research/assessments/${assessment.id}/evidence`).set(headers(analyst)).send(evidence).expect(201);
  assessment = (await request(app).get(`/api/research/assessments/${assessment.id}`).set(headers(analyst)).expect(200)).body.assessment;
  assert.equal(assessment.version, 2);
  assert.match(assessment.evidence[0].content_sha256, /^[a-f0-9]{64}$/);
  await request(app).post(`/api/research/assessments/${assessment.id}/evidence`).set(headers(analyst)).send({ ...evidence, expectedVersion: 2 }).expect(409).expect((response) => assert.equal(response.body.code, 'EVIDENCE_DUPLICATE'));
});

test('submission requires evidence and produces deterministic governed score', async () => {
  const empty = (await request(app).post('/api/research/assessments').set(headers(analyst)).send(assessmentBody('empty')).expect(201)).body.assessment;
  await request(app).post(`/api/research/assessments/${empty.id}/submit`).set(headers(analyst)).send({ expectedVersion: 1 }).expect(422).expect((response) => assert.equal(response.body.code, 'EVIDENCE_REQUIRED'));
  const submitted = await request(app).post(`/api/research/assessments/${assessment.id}/submit`).set(headers(analyst)).send({ expectedVersion: assessment.version }).expect(200);
  assessment = submitted.body.assessment;
  assert.equal(assessment.state, 'IN_REVIEW');
  assert.equal(assessment.recommendation, 'STRONG_CANDIDATE');
  assert.equal(Number(assessment.gross_annual_savings_cents), 16_000_000);
  assert.equal(Number(assessment.payback_months_bps), 225);
  const replay = await request(app).post(`/api/research/assessments/${assessment.id}/submit`).set(headers(analyst)).send({ expectedVersion: 1 }).expect(200);
  assert.equal(replay.body.assessment.id, assessment.id);
  await request(app).post(`/api/research/assessments/${assessment.id}/evidence`).set(headers(analyst)).send({ expectedVersion: assessment.version, evidenceKind: 'FILING', sourceTitle: 'Late evidence', publisher: 'Example', sourceUrl: 'https://example.test/late', observedAt: '2026-01-01', excerpt: 'This evidence must be rejected because the assessment has already entered review.' }).expect(409);
});

test('independent review prevents self-decision and records an immutable final state', async () => {
  const own = (await request(app).post('/api/research/assessments').set(headers(admin)).send(assessmentBody('admin-own')).expect(201)).body.assessment;
  await request(app).post(`/api/research/assessments/${own.id}/evidence`).set(headers(admin)).send({ expectedVersion: 1, evidenceKind: 'CONTRACT', sourceTitle: 'Signed annual contract', publisher: 'Internal procurement', sourceUrl: 'https://contracts.example.test/annual', observedAt: '2026-01-20', excerpt: 'The executed order form establishes the annual subscription and migration cost baseline.' }).expect(201);
  const ownSubmitted = (await request(app).post(`/api/research/assessments/${own.id}/submit`).set(headers(admin)).send({ expectedVersion: 2 }).expect(200)).body.assessment;
  await request(app).post(`/api/research/assessments/${own.id}/decision`).set(headers(admin)).send({ expectedVersion: ownSubmitted.version, decision: 'APPROVED', reason: 'Creator attempting self approval must fail.' }).expect(403).expect((response) => assert.equal(response.body.code, 'SELF_REVIEW_FORBIDDEN'));
  const decided = await request(app).post(`/api/research/assessments/${assessment.id}/decision`).set(headers(reviewer)).send({ expectedVersion: assessment.version, decision: 'APPROVED', reason: 'Evidence and deterministic cost model support a controlled pilot.' }).expect(200);
  assessment = decided.body.assessment;
  assert.equal(assessment.state, 'APPROVED');
  assert.equal(assessment.reviewed_by, reviewer.user.id);
  await request(app).post(`/api/research/assessments/${assessment.id}/decision`).set(headers(reviewer)).send({ expectedVersion: 1, decision: 'APPROVED', reason: 'Idempotent decision replay remains harmless.' }).expect(200);
});

test('audit chain and database guards reject evidence tampering', async () => {
  const audit = await request(app).get('/api/research/audit').set(headers(reviewer)).expect(200);
  assert.ok(audit.body.events.length >= 10);
  assert.deepEqual(audit.body.verification, { valid: true, checked: audit.body.events.length, firstInvalidSequence: null });
  for (let index = 1; index < audit.body.events.length; index += 1) assert.equal(audit.body.events[index].previous_hash, audit.body.events[index - 1].event_hash);
  await assert.rejects(() => pool.query('UPDATE research_audits SET outcome=$1 WHERE id=$2', ['TAMPERED', audit.body.events[0].id]), /immutable/);
  await assert.rejects(() => pool.query(`INSERT INTO assessment_evidence(assessment_id,organization_id,evidence_kind,source_title,publisher,source_url,observed_at,excerpt,content_sha256,created_by) VALUES($1,$2,'FILING','Tampered evidence','Bad actor','https://example.test/tampered','2026-01-01','Evidence inserted after approval must fail at the database boundary.',$3,$4)`, [assessment.id, admin.organization.id, 'f'.repeat(64), analyst.user.id]), /immutable/);
  const operations = await request(app).get('/api/research/operations').set(headers(reviewer)).expect(200);
  assert.ok(Number(operations.body.lastAuditSequence) >= audit.body.events.length);
});

test('legacy demo and generic AI routes are not executable', async () => {
  await request(app).post('/api/ai/issue-triage').send({}).expect(404);
  await request(app).post('/api/admin/seed').send({}).expect(404);
  await request(app).post('/api/gap-ai-agent-executor/run').send({}).expect(404);
});
