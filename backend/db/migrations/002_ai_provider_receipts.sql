CREATE TABLE ai_provider_receipts (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  prompt TEXT NOT NULL CHECK (char_length(prompt) BETWEEN 1 AND 4000),
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  provider VARCHAR(32) NOT NULL CHECK (provider = 'openrouter'),
  provider_request_id VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ai_provider_receipts_org_created_idx
  ON ai_provider_receipts(organization_id, created_at DESC);
