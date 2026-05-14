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
