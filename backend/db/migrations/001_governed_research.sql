CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, created_by)
);

CREATE TABLE organization_members (
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','ANALYST','REVIEWER')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE organization_invitations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ANALYST','REVIEWER')),
  token_hash CHAR(64) NOT NULL UNIQUE,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at > created_at)
);
CREATE UNIQUE INDEX organization_invitations_one_open ON organization_invitations(organization_id, email) WHERE used_at IS NULL;

CREATE TABLE research_assessments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  idempotency_key VARCHAR(128) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  incumbent_name VARCHAR(160) NOT NULL,
  challenger_name VARCHAR(160) NOT NULL,
  category VARCHAR(100) NOT NULL,
  hypothesis TEXT NOT NULL,
  annual_incumbent_cost_cents BIGINT NOT NULL CHECK (annual_incumbent_cost_cents >= 0),
  annual_challenger_cost_cents BIGINT NOT NULL CHECK (annual_challenger_cost_cents >= 0),
  migration_cost_cents BIGINT NOT NULL CHECK (migration_cost_cents >= 0),
  annual_hours_saved INTEGER NOT NULL CHECK (annual_hours_saved BETWEEN 0 AND 10000000),
  loaded_hourly_cost_cents INTEGER NOT NULL CHECK (loaded_hourly_cost_cents BETWEEN 0 AND 100000000),
  confidence_bps INTEGER NOT NULL CHECK (confidence_bps BETWEEN 0 AND 10000),
  annual_labor_savings_cents BIGINT,
  gross_annual_savings_cents BIGINT,
  first_year_net_benefit_cents BIGINT,
  confidence_adjusted_benefit_cents BIGINT,
  payback_months_bps BIGINT,
  recommendation VARCHAR(30) CHECK (recommendation IS NULL OR recommendation IN ('STRONG_CANDIDATE','REVIEW_REQUIRED','HOLD')),
  score_version VARCHAR(20),
  state VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (state IN ('DRAFT','IN_REVIEW','APPROVED','REJECTED')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  decision_reason TEXT,
  submitted_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, idempotency_key),
  UNIQUE (id, organization_id),
  CHECK (incumbent_name <> challenger_name)
);
CREATE INDEX research_assessments_org_state ON research_assessments(organization_id, state, updated_at DESC);

CREATE TABLE assessment_evidence (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  evidence_kind VARCHAR(30) NOT NULL CHECK (evidence_kind IN ('CASE_STUDY','FILING','CONTRACT','INTERVIEW','INTERNAL_ANALYSIS')),
  source_title VARCHAR(240) NOT NULL,
  publisher VARCHAR(160) NOT NULL,
  source_url TEXT NOT NULL,
  observed_at DATE NOT NULL,
  excerpt TEXT NOT NULL,
  content_sha256 CHAR(64) NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (assessment_id, organization_id) REFERENCES research_assessments(id, organization_id) ON DELETE RESTRICT,
  UNIQUE (assessment_id, content_sha256),
  CHECK (source_url ~ '^https://'),
  CHECK (char_length(excerpt) BETWEEN 20 AND 2000)
);
CREATE INDEX assessment_evidence_scope ON assessment_evidence(organization_id, assessment_id, created_at);

CREATE TABLE research_audits (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  sequence BIGINT NOT NULL,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action VARCHAR(80) NOT NULL,
  resource_type VARCHAR(60) NOT NULL,
  resource_id INTEGER NOT NULL,
  outcome VARCHAR(30) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_hash CHAR(64) NOT NULL,
  event_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (organization_id, sequence),
  UNIQUE (organization_id, event_hash)
);
CREATE INDEX research_audits_scope ON research_audits(organization_id, created_at DESC);

CREATE FUNCTION reject_research_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'research audit evidence is immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER research_audits_immutable BEFORE UPDATE OR DELETE ON research_audits FOR EACH ROW EXECUTE FUNCTION reject_research_audit_mutation();

CREATE FUNCTION protect_submitted_assessment() RETURNS trigger AS $$
BEGIN
  IF OLD.state <> 'DRAFT' AND
    (OLD.organization_id, OLD.request_hash, OLD.incumbent_name, OLD.challenger_name, OLD.category, OLD.hypothesis,
     OLD.annual_incumbent_cost_cents, OLD.annual_challenger_cost_cents, OLD.migration_cost_cents,
     OLD.annual_hours_saved, OLD.loaded_hourly_cost_cents, OLD.confidence_bps,
     OLD.annual_labor_savings_cents, OLD.gross_annual_savings_cents, OLD.first_year_net_benefit_cents,
     OLD.confidence_adjusted_benefit_cents, OLD.payback_months_bps, OLD.recommendation, OLD.score_version,
     OLD.created_by, OLD.submitted_at)
    IS DISTINCT FROM
    (NEW.organization_id, NEW.request_hash, NEW.incumbent_name, NEW.challenger_name, NEW.category, NEW.hypothesis,
     NEW.annual_incumbent_cost_cents, NEW.annual_challenger_cost_cents, NEW.migration_cost_cents,
     NEW.annual_hours_saved, NEW.loaded_hourly_cost_cents, NEW.confidence_bps,
     NEW.annual_labor_savings_cents, NEW.gross_annual_savings_cents, NEW.first_year_net_benefit_cents,
     NEW.confidence_adjusted_benefit_cents, NEW.payback_months_bps, NEW.recommendation, NEW.score_version,
     NEW.created_by, NEW.submitted_at) THEN
    RAISE EXCEPTION 'submitted assessment evidence and score are immutable';
  END IF;
  IF OLD.state IN ('APPROVED','REJECTED') AND OLD IS DISTINCT FROM NEW THEN
    RAISE EXCEPTION 'decided assessment is immutable';
  END IF;
  IF NOT ((OLD.state = NEW.state) OR (OLD.state = 'DRAFT' AND NEW.state = 'IN_REVIEW') OR (OLD.state = 'IN_REVIEW' AND NEW.state IN ('APPROVED','REJECTED'))) THEN
    RAISE EXCEPTION 'invalid assessment state transition';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER research_assessments_guard BEFORE UPDATE ON research_assessments FOR EACH ROW EXECUTE FUNCTION protect_submitted_assessment();

CREATE FUNCTION protect_assessment_evidence() RETURNS trigger AS $$
DECLARE assessment_state TEXT;
BEGIN
  SELECT state INTO assessment_state FROM research_assessments WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.assessment_id ELSE NEW.assessment_id END;
  IF assessment_state <> 'DRAFT' THEN RAISE EXCEPTION 'submitted assessment evidence is immutable'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER assessment_evidence_guard BEFORE INSERT OR UPDATE OR DELETE ON assessment_evidence FOR EACH ROW EXECUTE FUNCTION protect_assessment_evidence();
