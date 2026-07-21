const crypto = require('crypto');

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

function materialFromRow(row) {
  return canonical({
    organizationId: Number(row.organization_id),
    sequence: Number(row.sequence),
    actorId: Number(row.actor_id),
    action: row.action,
    resourceType: row.resource_type,
    resourceId: Number(row.resource_id),
    outcome: row.outcome,
    metadata: row.metadata,
    previousHash: row.previous_hash,
    createdAt: new Date(row.created_at).toISOString(),
  });
}

function verifyAuditChain(rows) {
  let previousHash = '0'.repeat(64);
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const sequence = Number(row.sequence);
    if (!Number.isSafeInteger(sequence) || sequence !== index + 1 || row.previous_hash !== previousHash || sha256(JSON.stringify(materialFromRow(row))) !== row.event_hash) {
      return { valid: false, checked: index, firstInvalidSequence: Number.isSafeInteger(sequence) ? sequence : String(row.sequence) };
    }
    previousHash = row.event_hash;
  }
  return { valid: true, checked: rows.length, firstInvalidSequence: null };
}

async function appendAudit(client, { organizationId, actorId, action, resourceType, resourceId, outcome, metadata = {} }) {
  await client.query('SELECT pg_advisory_xact_lock(73422, $1)', [organizationId]);
  const previous = (await client.query('SELECT sequence, event_hash FROM research_audits WHERE organization_id=$1 ORDER BY sequence DESC LIMIT 1', [organizationId])).rows[0];
  const sequence = previous ? Number(previous.sequence) + 1 : 1;
  if (!Number.isSafeInteger(sequence)) throw new Error('Audit sequence exceeds safe integer limits');
  const previousHash = previous?.event_hash || '0'.repeat(64);
  const createdAt = new Date().toISOString();
  const material = canonical({ organizationId, sequence, actorId, action, resourceType, resourceId, outcome, metadata, previousHash, createdAt });
  const eventHash = sha256(JSON.stringify(material));
  return (await client.query(
    `INSERT INTO research_audits(organization_id,sequence,actor_id,action,resource_type,resource_id,outcome,metadata,previous_hash,event_hash,created_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [organizationId, sequence, actorId, action, resourceType, resourceId, outcome, metadata, previousHash, eventHash, createdAt],
  )).rows[0];
}

module.exports = { appendAudit, sha256, canonical, verifyAuditChain };
