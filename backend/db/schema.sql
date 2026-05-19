CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, name VARCHAR(255), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT,
  status VARCHAR(50) DEFAULT 'active', priority VARCHAR(20) DEFAULT 'medium',
  start_date DATE, end_date DATE, owner VARCHAR(255), tech_stack TEXT, repository_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS labels (
  id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, color VARCHAR(50) DEFAULT 'bg-gray-500',
  description TEXT, project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100), avatar_color VARCHAR(50) DEFAULT 'bg-violet-500',
  department VARCHAR(100), time_zone VARCHAR(100), joined_date DATE,
  active BOOLEAN DEFAULT TRUE, github_handle VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sprints (
  id SERIAL PRIMARY KEY, project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, goal TEXT, status VARCHAR(50) DEFAULT 'planned',
  start_date DATE, end_date DATE, velocity INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY, project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id INT REFERENCES sprints(id) ON DELETE SET NULL,
  assignee_id INT REFERENCES team_members(id) ON DELETE SET NULL,
  title TEXT NOT NULL, description TEXT, status VARCHAR(50) DEFAULT 'backlog',
  priority VARCHAR(20) DEFAULT 'medium', issue_type VARCHAR(50) DEFAULT 'task',
  story_points INT DEFAULT 1, due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_labels (
  issue_id INT REFERENCES issues(id) ON DELETE CASCADE,
  label_id INT REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, label_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY, issue_id INT REFERENCES issues(id) ON DELETE CASCADE,
  author_id INT REFERENCES team_members(id) ON DELETE SET NULL,
  content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ============================================================================
-- SaaS Challengers domain: incumbents, challengers, displacement, switching,
-- pricing, and moats.  Added 2026-05-14.
-- ============================================================================

-- Incumbent SaaS vendors (Salesforce, Workday, Adobe, ServiceNow, Atlassian...)
CREATE TABLE IF NOT EXISTS incumbents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(80) NOT NULL,          -- CRM / HR / Creative / ITSM / DevTools / Legal / Support / Health
  flagship_product VARCHAR(160),
  annual_revenue_billions DECIMAL(8,2),   -- last reported FY revenue
  paying_seats_millions DECIMAL(8,2),     -- estimated total paid seats
  list_price_per_seat_usd DECIMAL(10,2),  -- typical per-seat per-year list price
  gross_margin_pct DECIMAL(5,2),          -- last reported GAAP gross margin
  code_lines_millions DECIMAL(8,2),       -- proxy for legacy moat
  rule_of_40 DECIMAL(6,2),
  hq_country VARCHAR(60),
  founded_year INT,
  ticker VARCHAR(10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incumbents_category ON incumbents(category);

-- AI-native challengers attacking those incumbents
CREATE TABLE IF NOT EXISTS challengers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  incumbent_id INT REFERENCES incumbents(id) ON DELETE SET NULL,
  category VARCHAR(80),
  ai_native_thesis TEXT,                  -- one-paragraph attack thesis
  pricing_model VARCHAR(40),              -- per_seat / per_action / outcome / freemium / hybrid
  arr_millions DECIMAL(10,2),             -- annualised revenue
  total_funding_millions DECIMAL(10,2),
  last_valuation_billions DECIMAL(10,2),
  fte_per_million_arr DECIMAL(8,2),       -- headcount displaced per $1M ARR
  customer_count INT,
  flagship_customers TEXT,                -- comma-separated logos
  founded_year INT,
  stage VARCHAR(30),                      -- seed / series_a / series_b / series_c / late / public
  hq_country VARCHAR(60),
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_challengers_incumbent ON challengers(incumbent_id);
CREATE INDEX IF NOT EXISTS idx_challengers_category ON challengers(category);

-- Pricing model definitions and unit economics
CREATE TABLE IF NOT EXISTS pricing_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE,       -- per_seat / per_action / outcome / hybrid / freemium
  description TEXT,
  typical_acv_usd DECIMAL(12,2),          -- median ACV at this model
  gross_margin_pct DECIMAL(5,2),          -- typical GM at this model
  scaling_curve VARCHAR(40),              -- linear / sublinear / superlinear
  buyer_persona VARCHAR(80),
  notes TEXT
);

-- Seat-displacement records: how many human FTE a challenger eliminates per customer
CREATE TABLE IF NOT EXISTS displacement_cases (
  id SERIAL PRIMARY KEY,
  challenger_id INT REFERENCES challengers(id) ON DELETE CASCADE,
  customer_name VARCHAR(160) NOT NULL,
  industry VARCHAR(80),
  pre_headcount INT,                      -- FTE doing the work before
  post_headcount INT,                     -- FTE after deploying the challenger
  contract_acv_usd DECIMAL(12,2),         -- annual contract value
  loaded_fte_cost_usd DECIMAL(12,2),      -- fully-loaded cost per displaced FTE
  payback_months DECIMAL(6,2),
  evidence_url TEXT,
  reported_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_displacement_challenger ON displacement_cases(challenger_id);

-- Switching cost line items between an incumbent and a challenger
CREATE TABLE IF NOT EXISTS switching_costs (
  id SERIAL PRIMARY KEY,
  incumbent_id INT REFERENCES incumbents(id) ON DELETE CASCADE,
  challenger_id INT REFERENCES challengers(id) ON DELETE CASCADE,
  cost_category VARCHAR(60) NOT NULL,     -- data_migration / training / integration / contract / risk
  description TEXT,
  one_time_cost_usd DECIMAL(12,2),
  duration_weeks DECIMAL(6,2),
  risk_level VARCHAR(20),                 -- low / medium / high / critical
  blocker BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_switch_pair ON switching_costs(incumbent_id, challenger_id);

-- Defensive moat assessment per challenger (and per incumbent for comparison)
CREATE TABLE IF NOT EXISTS moats (
  id SERIAL PRIMARY KEY,
  challenger_id INT REFERENCES challengers(id) ON DELETE CASCADE,
  proprietary_data_score INT,             -- 0-10
  vertical_workflow_score INT,            -- 0-10
  network_effect_score INT,               -- 0-10
  switching_cost_score INT,               -- 0-10
  brand_score INT,                        -- 0-10
  regulatory_moat_score INT,              -- 0-10
  composite_score DECIMAL(5,2),
  rationale TEXT,
  assessed_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moats_challenger ON moats(challenger_id);
