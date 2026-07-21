const crypto = require('crypto');
const router = require('express').Router();
const pool = require('../db');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const { AppError } = require('../lib/errors');
const { objectBody, text, email, integer, expectedVersion } = require('../lib/validation');
const { calculateAssessmentScore } = require('../services/scoring');
const { appendAudit, sha256, canonical, verifyAuditChain } = require('../services/audit');

router.use(authenticate);

function assessmentInput(body) {
  return {
    idempotency_key: text(body.idempotencyKey, 'idempotencyKey', { min: 8, max: 128 }),
    incumbent_name: text(body.incumbentName, 'incumbentName', { min: 2, max: 160 }),
    challenger_name: text(body.challengerName, 'challengerName', { min: 2, max: 160 }),
    category: text(body.category, 'category', { min: 2, max: 100 }),
    hypothesis: text(body.hypothesis, 'hypothesis', { min: 30, max: 3000 }),
    annual_incumbent_cost_cents: integer(body.annualIncumbentCostCents, 'annualIncumbentCostCents', { max: 1_000_000_000_000 }),
    annual_challenger_cost_cents: integer(body.annualChallengerCostCents, 'annualChallengerCostCents', { max: 1_000_000_000_000 }),
    migration_cost_cents: integer(body.migrationCostCents, 'migrationCostCents', { max: 1_000_000_000_000 }),
    annual_hours_saved: integer(body.annualHoursSaved, 'annualHoursSaved', { max: 10_000_000 }),
    loaded_hourly_cost_cents: integer(body.loadedHourlyCostCents, 'loadedHourlyCostCents', { max: 100_000_000 }),
    confidence_bps: integer(body.confidenceBps, 'confidenceBps', { max: 10_000 }),
  };
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError('Resource identifier is invalid', 400, 'ID_INVALID');
  return id;
}

async function inSerializable(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '40001') throw new AppError('Concurrent change detected; retry the same idempotent request', 409, 'SERIALIZATION_RETRY');
    throw error;
  } finally { client.release(); }
}

async function assessmentWithEvidence(client, organizationId, id) {
  const assessment = (await client.query('SELECT * FROM research_assessments WHERE organization_id=$1 AND id=$2', [organizationId, id])).rows[0];
  if (!assessment) throw new AppError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
  assessment.evidence = (await client.query('SELECT id,evidence_kind,source_title,publisher,source_url,observed_at,excerpt,content_sha256,created_by,created_at FROM assessment_evidence WHERE organization_id=$1 AND assessment_id=$2 ORDER BY created_at', [organizationId, id])).rows;
  return assessment;
}

router.get('/assessments', authorize('ADMIN', 'ANALYST', 'REVIEWER'), async (req, res, next) => {
  try {
    const state = req.query.state ? String(req.query.state) : null;
    if (state && !['DRAFT','IN_REVIEW','APPROVED','REJECTED'].includes(state)) throw new AppError('State filter is invalid', 422, 'VALIDATION_ERROR');
    const { rows } = await pool.query(
      `SELECT a.*, COUNT(e.id)::INTEGER AS evidence_count
       FROM research_assessments a LEFT JOIN assessment_evidence e ON e.assessment_id=a.id AND e.organization_id=a.organization_id
       WHERE a.organization_id=$1 AND ($2::TEXT IS NULL OR a.state=$2)
       GROUP BY a.id ORDER BY a.updated_at DESC LIMIT 100`,
      [req.actor.organization_id, state],
    );
    res.json({ assessments: rows });
  } catch (error) { next(error); }
});

router.get('/assessments/:id', authorize('ADMIN', 'ANALYST', 'REVIEWER'), async (req, res, next) => {
  try { res.json({ assessment: await assessmentWithEvidence(pool, req.actor.organization_id, parseId(req.params.id)) }); }
  catch (error) { next(error); }
});

router.post('/assessments', authorize('ADMIN', 'ANALYST'), async (req, res, next) => {
  try {
    const input = assessmentInput(objectBody(req));
    if (input.incumbent_name.toLowerCase() === input.challenger_name.toLowerCase()) throw new AppError('Incumbent and challenger must differ', 422, 'VALIDATION_ERROR');
    const requestHash = sha256(JSON.stringify(canonical(input)));
    const assessment = await inSerializable(async (client) => {
      const existing = (await client.query('SELECT * FROM research_assessments WHERE organization_id=$1 AND idempotency_key=$2', [req.actor.organization_id, input.idempotency_key])).rows[0];
      if (existing) {
        if (existing.request_hash !== requestHash) throw new AppError('Idempotency key was used for different inputs', 409, 'IDEMPOTENCY_CONFLICT');
        return { ...existing, duplicate: true };
      }
      const values = [req.actor.organization_id, input.idempotency_key, requestHash, input.incumbent_name, input.challenger_name, input.category, input.hypothesis, input.annual_incumbent_cost_cents, input.annual_challenger_cost_cents, input.migration_cost_cents, input.annual_hours_saved, input.loaded_hourly_cost_cents, input.confidence_bps, req.actor.id];
      const created = (await client.query(
        `INSERT INTO research_assessments(organization_id,idempotency_key,request_hash,incumbent_name,challenger_name,category,hypothesis,annual_incumbent_cost_cents,annual_challenger_cost_cents,migration_cost_cents,annual_hours_saved,loaded_hourly_cost_cents,confidence_bps,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, values,
      )).rows[0];
      await appendAudit(client, { organizationId: req.actor.organization_id, actorId: req.actor.id, action: 'ASSESSMENT_CREATED', resourceType: 'ResearchAssessment', resourceId: created.id, outcome: 'SUCCESS', metadata: { idempotencyKey: input.idempotency_key } });
      return created;
    });
    res.status(assessment.duplicate ? 200 : 201).json({ assessment, duplicate: Boolean(assessment.duplicate) });
  } catch (error) { next(error); }
});

router.post('/assessments/:id/evidence', authorize('ADMIN', 'ANALYST'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id); const body = objectBody(req);
    const expected = expectedVersion(body.expectedVersion);
    const evidenceKind = text(body.evidenceKind, 'evidenceKind', { min: 3, max: 30 });
    if (!['CASE_STUDY','FILING','CONTRACT','INTERVIEW','INTERNAL_ANALYSIS'].includes(evidenceKind)) throw new AppError('Evidence kind is invalid', 422, 'VALIDATION_ERROR');
    const sourceTitle = text(body.sourceTitle, 'sourceTitle', { min: 3, max: 240 });
    const publisher = text(body.publisher, 'publisher', { min: 2, max: 160 });
    const sourceUrl = text(body.sourceUrl, 'sourceUrl', { min: 10, max: 2000 });
    let parsedUrl;
    try { parsedUrl = new URL(sourceUrl); } catch { throw new AppError('Source URL is invalid', 422, 'VALIDATION_ERROR'); }
    if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) throw new AppError('Source URL must be credential-free HTTPS', 422, 'VALIDATION_ERROR');
    const observedAt = new Date(`${text(body.observedAt, 'observedAt', { min: 10, max: 10 })}T00:00:00Z`);
    if (Number.isNaN(observedAt.getTime()) || observedAt > new Date() || observedAt < new Date('1900-01-01T00:00:00Z')) throw new AppError('Observed date is invalid', 422, 'VALIDATION_ERROR');
    const excerpt = text(body.excerpt, 'excerpt', { min: 20, max: 2000 });
    const contentHash = sha256(JSON.stringify(canonical({ evidenceKind, sourceTitle, publisher, sourceUrl: parsedUrl.toString(), observedAt: observedAt.toISOString().slice(0, 10), excerpt })));
    const evidence = await inSerializable(async (client) => {
      const assessment = (await client.query('SELECT * FROM research_assessments WHERE organization_id=$1 AND id=$2 FOR UPDATE', [req.actor.organization_id, id])).rows[0];
      if (!assessment) throw new AppError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      if (assessment.state !== 'DRAFT') throw new AppError('Evidence is locked after submission', 409, 'ASSESSMENT_LOCKED');
      if (assessment.version !== expected) throw new AppError('Assessment version changed; refresh before retrying', 409, 'VERSION_CONFLICT');
      let created;
      try {
        created = (await client.query(
          `INSERT INTO assessment_evidence(assessment_id,organization_id,evidence_kind,source_title,publisher,source_url,observed_at,excerpt,content_sha256,created_by)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [id, req.actor.organization_id, evidenceKind, sourceTitle, publisher, parsedUrl.toString(), observedAt.toISOString().slice(0, 10), excerpt, contentHash, req.actor.id],
        )).rows[0];
      } catch (error) {
        if (error.code === '23505') throw new AppError('This evidence is already attached', 409, 'EVIDENCE_DUPLICATE');
        throw error;
      }
      await client.query('UPDATE research_assessments SET version=version+1,updated_at=NOW() WHERE id=$1', [id]);
      await appendAudit(client, { organizationId: req.actor.organization_id, actorId: req.actor.id, action: 'EVIDENCE_ATTACHED', resourceType: 'ResearchAssessment', resourceId: id, outcome: 'SUCCESS', metadata: { evidenceId: created.id, contentHash } });
      return created;
    });
    res.status(201).json({ evidence });
  } catch (error) { next(error); }
});

router.post('/assessments/:id/submit', authorize('ADMIN', 'ANALYST'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id); const expected = expectedVersion(objectBody(req).expectedVersion);
    const assessment = await inSerializable(async (client) => {
      const current = (await client.query('SELECT * FROM research_assessments WHERE organization_id=$1 AND id=$2 FOR UPDATE', [req.actor.organization_id, id])).rows[0];
      if (!current) throw new AppError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      if (current.state === 'IN_REVIEW') return current;
      if (current.state !== 'DRAFT') throw new AppError('Assessment cannot be submitted from its current state', 409, 'STATE_CONFLICT');
      if (current.version !== expected) throw new AppError('Assessment version changed; refresh before retrying', 409, 'VERSION_CONFLICT');
      const evidenceCount = Number((await client.query('SELECT COUNT(*) FROM assessment_evidence WHERE organization_id=$1 AND assessment_id=$2', [req.actor.organization_id, id])).rows[0].count);
      if (evidenceCount < 1) throw new AppError('At least one attributable evidence item is required', 422, 'EVIDENCE_REQUIRED');
      const score = calculateAssessmentScore(current);
      const updated = (await client.query(
        `UPDATE research_assessments SET annual_labor_savings_cents=$1,gross_annual_savings_cents=$2,first_year_net_benefit_cents=$3,confidence_adjusted_benefit_cents=$4,payback_months_bps=$5,recommendation=$6,score_version=$7,state='IN_REVIEW',version=version+1,submitted_at=NOW(),updated_at=NOW() WHERE id=$8 RETURNING *`,
        [score.annual_labor_savings_cents, score.gross_annual_savings_cents, score.first_year_net_benefit_cents, score.confidence_adjusted_benefit_cents, score.payback_months_bps, score.recommendation, score.score_version, id],
      )).rows[0];
      await appendAudit(client, { organizationId: req.actor.organization_id, actorId: req.actor.id, action: 'ASSESSMENT_SUBMITTED', resourceType: 'ResearchAssessment', resourceId: id, outcome: 'IN_REVIEW', metadata: { scoreVersion: score.score_version, recommendation: score.recommendation, evidenceCount } });
      return updated;
    });
    res.json({ assessment });
  } catch (error) { next(error); }
});

router.post('/assessments/:id/decision', authorize('ADMIN', 'REVIEWER'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id); const body = objectBody(req);
    const expected = expectedVersion(body.expectedVersion);
    const decision = text(body.decision, 'decision', { min: 6, max: 8 });
    if (!['APPROVED','REJECTED'].includes(decision)) throw new AppError('Decision is invalid', 422, 'VALIDATION_ERROR');
    const reason = text(body.reason, 'reason', { min: 10, max: 1000 });
    const assessment = await inSerializable(async (client) => {
      const current = (await client.query('SELECT * FROM research_assessments WHERE organization_id=$1 AND id=$2 FOR UPDATE', [req.actor.organization_id, id])).rows[0];
      if (!current) throw new AppError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
      if (current.state === decision) return current;
      if (current.state !== 'IN_REVIEW') throw new AppError('Only in-review assessments can be decided', 409, 'STATE_CONFLICT');
      if (current.version !== expected) throw new AppError('Assessment version changed; refresh before retrying', 409, 'VERSION_CONFLICT');
      if (current.created_by === req.actor.id) throw new AppError('Assessment creator cannot approve or reject their own assessment', 403, 'SELF_REVIEW_FORBIDDEN');
      const updated = (await client.query(`UPDATE research_assessments SET state=$1,reviewed_by=$2,decision_reason=$3,decided_at=NOW(),updated_at=NOW(),version=version+1 WHERE id=$4 RETURNING *`, [decision, req.actor.id, reason, id])).rows[0];
      await appendAudit(client, { organizationId: req.actor.organization_id, actorId: req.actor.id, action: `ASSESSMENT_${decision}`, resourceType: 'ResearchAssessment', resourceId: id, outcome: decision, metadata: { reason } });
      return updated;
    });
    res.json({ assessment });
  } catch (error) { next(error); }
});

router.post('/invitations', authorize('ADMIN'), async (req, res, next) => {
  try {
    const body = objectBody(req); const invitedEmail = email(body.email); const role = text(body.role, 'role', { min: 7, max: 8 });
    if (!['ANALYST','REVIEWER'].includes(role)) throw new AppError('Invitation role is invalid', 422, 'VALIDATION_ERROR');
    const rawToken = crypto.randomBytes(32).toString('base64url'); const tokenHash = sha256(rawToken);
    const invitation = await inSerializable(async (client) => {
      await client.query('UPDATE organization_invitations SET used_at=NOW() WHERE organization_id=$1 AND email=$2 AND used_at IS NULL AND expires_at <= NOW()', [req.actor.organization_id, invitedEmail]);
      let created;
      try {
        created = (await client.query(`INSERT INTO organization_invitations(organization_id,email,role,token_hash,created_by,expires_at) VALUES($1,$2,$3,$4,$5,NOW()+INTERVAL '24 hours') RETURNING id,email,role,expires_at`, [req.actor.organization_id, invitedEmail, role, tokenHash, req.actor.id])).rows[0];
      } catch (error) {
        if (error.code === '23505') throw new AppError('An active invitation already exists', 409, 'INVITATION_CONFLICT');
        throw error;
      }
      await appendAudit(client, { organizationId: req.actor.organization_id, actorId: req.actor.id, action: 'MEMBER_INVITED', resourceType: 'OrganizationInvitation', resourceId: created.id, outcome: 'PENDING', metadata: { email: invitedEmail, role } });
      return created;
    });
    res.status(201).json({ invitation: { ...invitation, token: rawToken }, warning: 'The invitation token is returned once.' });
  } catch (error) { next(error); }
});

router.get('/audit', authorize('ADMIN', 'REVIEWER'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM research_audits WHERE organization_id=$1 ORDER BY sequence ASC LIMIT 10000', [req.actor.organization_id]);
    res.set('Cache-Control', 'no-store').json({ events: rows, verification: verifyAuditChain(rows) });
  } catch (error) { next(error); }
});

router.get('/operations', authorize('ADMIN', 'REVIEWER'), async (req, res, next) => {
  try {
    const organizationId = req.actor.organization_id;
    const [states, staleReview, evidence, audits] = await Promise.all([
      pool.query('SELECT state,COUNT(*)::INTEGER AS count FROM research_assessments WHERE organization_id=$1 GROUP BY state', [organizationId]),
      pool.query(`SELECT COUNT(*)::INTEGER AS count FROM research_assessments WHERE organization_id=$1 AND state='IN_REVIEW' AND submitted_at < NOW()-INTERVAL '48 hours'`, [organizationId]),
      pool.query('SELECT COUNT(*)::INTEGER AS count FROM assessment_evidence WHERE organization_id=$1', [organizationId]),
      pool.query('SELECT COALESCE(MAX(sequence),0) AS sequence FROM research_audits WHERE organization_id=$1', [organizationId]),
    ]);
    res.set('Cache-Control', 'no-store').json({ states: states.rows, staleReviews: staleReview.rows[0].count, evidenceCount: evidence.rows[0].count, lastAuditSequence: audits.rows[0].sequence, checkedAt: new Date().toISOString() });
  } catch (error) { next(error); }
});

module.exports = router;
