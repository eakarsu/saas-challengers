const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('startup never installs, seeds, migrates, creates databases, or kills unrelated processes', () => {
  const launcher = read('start.sh');
  assert.doesNotMatch(launcher, /npm (install|ci)|seed\.sql|schema\.sql|CREATE DATABASE|kill -9|pkill|xargs kill|npm run migrate/);
  assert.match(launcher, /127\.0\.0\.1/);
});

test('only the bounded research workflow is mounted', () => {
  const server = read('backend/server.js');
  assert.match(server, /routes\/research/);
  assert.doesNotMatch(server, /routes\/(ai|sample_data|gap-|cf-|projects|issues|challengers)/);
  assert.doesNotMatch(read('frontend/src/App.tsx'), /Gap|SampleData|AICenter|mockData/);
});

test('tenant, immutable evidence, secret, and production controls are explicit', () => {
  assert.match(read('backend/middleware/auth.js'), /organization_members/);
  assert.match(read('backend/db/migrations/001_governed_research.sql'), /research_audits_immutable/);
  assert.match(read('backend/db/migrations/001_governed_research.sql'), /assessment_evidence_guard/);
  assert.match(read('.gitignore'), /^\.env$/m);
  assert.doesNotMatch(read('backend/config.js'), /your_openrouter|demo123|fallback.*secret/i);
  assert.match(read('backend/config.js'), /JWT_SECRET must be generated and cannot use an example placeholder/);
  assert.match(read('backend/config.js'), /DATABASE_URL cannot contain an example placeholder/);
});
