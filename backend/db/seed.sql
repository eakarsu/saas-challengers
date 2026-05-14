-- Demo user (password: demo123)
INSERT INTO users (email, password_hash, name) VALUES
  ('admin@demo.com', '$2b$10$e4dPQpe3XIDluCZCv3b3iu/H/3f816tgim6l5ly5k7pChHG235Dey', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Team Members
INSERT INTO team_members (name, email, role, avatar_color, department, time_zone, joined_date, active, github_handle) VALUES
  ('Alice Chen', 'alice@momentum.io', 'Engineering Lead', 'bg-violet-500', 'Engineering', 'PST (UTC-8)', '2022-03-15', true, 'alice-chen'),
  ('Bob Martinez', 'bob@momentum.io', 'Senior Frontend Engineer', 'bg-blue-500', 'Engineering', 'EST (UTC-5)', '2022-06-01', true, 'bobm-dev'),
  ('Carol Kim', 'carol@momentum.io', 'Backend Engineer', 'bg-green-500', 'Engineering', 'KST (UTC+9)', '2022-09-12', true, 'carolkim'),
  ('David Park', 'david@momentum.io', 'Product Manager', 'bg-orange-500', 'Product', 'PST (UTC-8)', '2021-11-08', true, 'davidpark-pm'),
  ('Eva Torres', 'eva@momentum.io', 'UX Designer', 'bg-pink-500', 'Design', 'CET (UTC+1)', '2023-01-20', true, 'eva-ux'),
  ('Frank Liu', 'frank@momentum.io', 'DevOps Engineer', 'bg-teal-500', 'Infrastructure', 'CST (UTC+8)', '2022-04-05', true, 'frank-ops'),
  ('Grace Wilson', 'grace@momentum.io', 'QA Engineer', 'bg-yellow-500', 'Quality', 'GMT (UTC+0)', '2023-03-14', true, 'gracewilson-qa'),
  ('Henry Brown', 'henry@momentum.io', 'Data Engineer', 'bg-red-500', 'Data', 'EST (UTC-5)', '2022-07-19', true, 'henrybrown'),
  ('Iris Zhang', 'iris@momentum.io', 'Security Engineer', 'bg-indigo-500', 'Security', 'SGT (UTC+8)', '2023-06-01', true, 'iris-sec'),
  ('Jack Thompson', 'jack@momentum.io', 'ML Engineer', 'bg-purple-500', 'AI/ML', 'PST (UTC-8)', '2023-08-15', true, 'jackml'),
  ('Kate Lee', 'kate@momentum.io', 'Tech Lead', 'bg-cyan-500', 'Engineering', 'EST (UTC-5)', '2021-05-10', true, 'katecodes'),
  ('Liam Johnson', 'liam@momentum.io', 'Junior Developer', 'bg-lime-500', 'Engineering', 'CST (UTC-6)', '2024-01-08', true, 'liamj-dev'),
  ('Maya Patel', 'maya@momentum.io', 'Product Designer', 'bg-fuchsia-500', 'Design', 'IST (UTC+5:30)', '2023-09-25', true, 'mayaui'),
  ('Noah Davis', 'noah@momentum.io', 'Scrum Master', 'bg-amber-500', 'Delivery', 'MST (UTC-7)', '2022-02-14', true, 'noahscrum'),
  ('Olivia White', 'olivia@momentum.io', 'CTO', 'bg-rose-500', 'Leadership', 'PST (UTC-8)', '2020-08-01', true, 'oliviaw-cto')
ON CONFLICT (email) DO NOTHING;

-- Projects
INSERT INTO projects (name, description, status, priority, start_date, end_date, owner, tech_stack, repository_url) VALUES
  ('Momentum Core', 'Project management platform rebuild with AI-native features and real-time collaboration', 'active', 'critical', '2024-01-15', '2024-12-31', 'Alice Chen', 'React, Node.js, PostgreSQL, Redis', 'https://github.com/momentum/core'),
  ('AI Assistant', 'Intelligent sprint planning, issue triage, and velocity prediction engine', 'active', 'high', '2024-03-01', '2024-09-30', 'Jack Thompson', 'Python, FastAPI, LangChain, OpenAI', 'https://github.com/momentum/ai'),
  ('Mobile App', 'Native iOS and Android apps for on-the-go project management', 'active', 'medium', '2024-04-01', '2024-11-15', 'Bob Martinez', 'React Native, Expo, TypeScript', 'https://github.com/momentum/mobile'),
  ('Analytics Dashboard', 'Team velocity, burndown charts, and predictive analytics', 'planned', 'high', '2024-07-01', '2025-01-31', 'Henry Brown', 'Next.js, D3.js, dbt, BigQuery', 'https://github.com/momentum/analytics'),
  ('Integrations Hub', 'GitHub, Slack, Jira, Linear, and Figma integrations', 'active', 'medium', '2024-05-15', '2024-10-31', 'Frank Liu', 'Node.js, Webhooks, OAuth 2.0', 'https://github.com/momentum/integrations'),
  ('Design System', 'Component library, design tokens, and Storybook documentation', 'active', 'low', '2024-02-01', '2024-08-31', 'Eva Torres', 'React, Storybook, Figma, CSS-in-JS', 'https://github.com/momentum/design-system'),
  ('API Gateway', 'GraphQL API layer with rate limiting, caching, and auth middleware', 'paused', 'high', '2024-03-15', '2024-09-15', 'Carol Kim', 'GraphQL, Apollo, Redis, JWT', 'https://github.com/momentum/api'),
  ('Search Service', 'Full-text search across issues, comments, and documents using vector embeddings', 'planned', 'medium', '2024-08-01', '2025-02-28', 'Iris Zhang', 'Elasticsearch, pgvector, Python', 'https://github.com/momentum/search'),
  ('Notifications', 'Real-time and async notification system with digest emails and push alerts', 'active', 'medium', '2024-04-15', '2024-09-30', 'Grace Wilson', 'Node.js, WebSockets, SendGrid', 'https://github.com/momentum/notifications'),
  ('Customer Portal', 'Self-service portal for enterprise customers to manage seats and billing', 'planned', 'low', '2024-09-01', '2025-03-31', 'David Park', 'Next.js, Stripe, PostgreSQL', 'https://github.com/momentum/portal'),
  ('CI/CD Pipeline', 'Automated testing, deployment, and rollback infrastructure', 'active', 'high', '2024-01-01', '2024-06-30', 'Frank Liu', 'GitHub Actions, Docker, Kubernetes, Terraform', 'https://github.com/momentum/infra'),
  ('Data Warehouse', 'Event sourcing pipeline and analytics data lake for business intelligence', 'planned', 'medium', '2024-10-01', '2025-06-30', 'Henry Brown', 'Kafka, Spark, dbt, Snowflake', 'https://github.com/momentum/warehouse'),
  ('Documentation Site', 'Interactive docs with live code examples and API reference', 'active', 'low', '2024-06-01', '2024-10-31', 'Noah Davis', 'Docusaurus, MDX, Algolia Search', 'https://github.com/momentum/docs'),
  ('Auth Service', 'SSO, SAML, OAuth, and enterprise identity management', 'active', 'critical', '2024-02-15', '2024-08-15', 'Iris Zhang', 'Node.js, Passport.js, Redis, SAML', 'https://github.com/momentum/auth'),
  ('Performance Monitor', 'APM, error tracking, and SLA monitoring across all services', 'planned', 'high', '2024-11-01', '2025-04-30', 'Frank Liu', 'OpenTelemetry, Grafana, Prometheus', 'https://github.com/momentum/monitoring')
ON CONFLICT DO NOTHING;

-- Labels
INSERT INTO labels (name, color, description, project_id) VALUES
  ('bug', 'bg-red-500', 'Something is broken', 1),
  ('feature', 'bg-blue-500', 'New functionality', 1),
  ('enhancement', 'bg-green-500', 'Improvement to existing feature', 1),
  ('design', 'bg-pink-500', 'Design work required', 1),
  ('backend', 'bg-orange-500', 'Backend changes', 1),
  ('frontend', 'bg-cyan-500', 'Frontend changes', 1),
  ('performance', 'bg-yellow-500', 'Performance improvement', 1),
  ('security', 'bg-purple-500', 'Security related', 1),
  ('testing', 'bg-teal-500', 'Tests needed', 1),
  ('documentation', 'bg-gray-500', 'Docs updates needed', 1),
  ('ai-generated', 'bg-violet-500', 'Created by AI assistant', 1),
  ('critical', 'bg-rose-600', 'Requires immediate attention', 1),
  ('good-first-issue', 'bg-lime-500', 'Good for newcomers', 1),
  ('wontfix', 'bg-gray-600', 'Will not be fixed', 1),
  ('duplicate', 'bg-amber-500', 'Already reported', 1)
ON CONFLICT DO NOTHING;

-- Sprints
INSERT INTO sprints (project_id, name, goal, status, start_date, end_date, velocity) VALUES
  (1, 'Sprint 1', 'Set up core infrastructure and authentication flow', 'completed', '2024-01-15', '2024-01-28', 42),
  (1, 'Sprint 2', 'Build project and issue CRUD with basic Kanban board', 'completed', '2024-01-29', '2024-02-11', 38),
  (1, 'Sprint 3', 'Implement real-time updates and collaboration features', 'completed', '2024-02-12', '2024-02-25', 45),
  (1, 'Sprint 4', 'AI issue triage and sprint planning features', 'active', '2024-02-26', '2024-03-10', 0),
  (1, 'Sprint 5', 'Analytics dashboard and velocity charts', 'planned', '2024-03-11', '2024-03-24', 0),
  (2, 'AI Sprint 1', 'LLM integration and basic issue classification', 'completed', '2024-03-01', '2024-03-14', 28),
  (2, 'AI Sprint 2', 'Sprint prediction and workload balancing features', 'active', '2024-03-15', '2024-03-28', 0),
  (3, 'Mobile Sprint 1', 'Navigation skeleton and authentication screens', 'active', '2024-04-01', '2024-04-14', 0),
  (4, 'Analytics Sprint 1', 'Data pipeline setup and basic metric collection', 'planned', '2024-07-01', '2024-07-14', 0),
  (5, 'Integrations Sprint 1', 'GitHub and Slack webhook implementations', 'completed', '2024-05-15', '2024-05-28', 33),
  (5, 'Integrations Sprint 2', 'Jira and Linear bi-directional sync', 'active', '2024-05-29', '2024-06-11', 0),
  (6, 'Design Sprint 1', 'Core component library and typography system', 'completed', '2024-02-01', '2024-02-14', 25),
  (6, 'Design Sprint 2', 'Form components, data tables, and modals', 'active', '2024-02-15', '2024-02-28', 0),
  (1, 'Sprint 6', 'Performance optimization and load testing', 'planned', '2024-03-25', '2024-04-07', 0),
  (1, 'Sprint 7', 'Mobile responsiveness and accessibility improvements', 'planned', '2024-04-08', '2024-04-21', 0)
ON CONFLICT DO NOTHING;

-- Issues
INSERT INTO issues (project_id, sprint_id, assignee_id, title, description, status, priority, issue_type, story_points, due_date) VALUES
  (1, 4, 1, 'Fix race condition in websocket reconnection logic', 'Users experience duplicate messages when reconnecting after a network drop. The issue occurs in the WebSocket manager when two connections are attempted simultaneously.', 'in_progress', 'high', 'bug', 5, '2024-03-08'),
  (1, 4, 2, 'Implement drag-and-drop issue reordering', 'Allow users to reorder issues within a status column and move between columns via drag-and-drop using DnD Kit library.', 'in_progress', 'medium', 'feature', 8, '2024-03-09'),
  (1, 4, 3, 'Add PostgreSQL full-text search for issues', 'Replace the current ILIKE queries with PostgreSQL GIN indexes and tsvector for faster issue search across titles and descriptions.', 'todo', 'high', 'enhancement', 5, '2024-03-10'),
  (1, 4, 5, 'Redesign sprint planning modal with timeline view', 'The current sprint planning modal lacks visual date context. Redesign with a mini Gantt view for capacity planning.', 'todo', 'medium', 'feature', 8, NULL),
  (1, 5, 1, 'Build burndown chart component', 'Create an interactive burndown chart using Chart.js showing ideal vs actual progress throughout the sprint.', 'backlog', 'medium', 'feature', 13, NULL),
  (1, 4, 6, 'Set up Redis caching for project dashboards', 'Cache project summary data in Redis with 60s TTL to reduce database load during peak usage.', 'done', 'high', 'enhancement', 3, '2024-03-05'),
  (1, NULL, 4, 'Define Q2 OKRs for Momentum Core', 'Work with leadership to finalize Q2 objectives and key results, then break down into trackable milestones.', 'backlog', 'medium', 'task', 2, NULL),
  (1, 4, 7, 'Add keyboard shortcuts for issue management', 'Implement vim-style keyboard shortcuts: j/k navigation, space to select, e to edit, d to delete, c to create new.', 'in_progress', 'low', 'feature', 5, NULL),
  (1, 4, 3, 'Fix N+1 query in team member endpoint', 'The GET /api/team endpoint runs a separate query for each member to fetch their issue count. Replace with JOIN.', 'done', 'high', 'bug', 2, '2024-03-06'),
  (1, 4, 2, 'Implement optimistic updates for issue status changes', 'Update UI immediately on status change without waiting for API response, with rollback on error.', 'todo', 'medium', 'enhancement', 3, NULL),
  (2, 6, 10, 'Integrate Claude API for issue summarization', 'Add AI-powered issue summary generation that extracts key points from long descriptions and comment threads.', 'done', 'high', 'feature', 8, '2024-03-14'),
  (2, 7, 10, 'Build sprint capacity predictor', 'Train a model on historical velocity data to predict realistic sprint capacity considering team composition and past performance.', 'in_progress', 'high', 'feature', 13, NULL),
  (2, 7, 1, 'Implement automated issue triage', 'Use NLP to classify incoming issues by type, priority, and likely assignee based on content analysis and historical patterns.', 'todo', 'medium', 'feature', 8, NULL),
  (3, 8, 2, 'Build navigation tab bar for mobile', 'Implement bottom navigation with Home, Projects, Issues, and Notifications tabs with animated transitions.', 'in_progress', 'high', 'feature', 5, NULL),
  (3, 8, 5, 'Design mobile issue card component', 'Create compact issue card with swipe actions for quick status updates and long-press context menu.', 'todo', 'medium', 'design', 5, NULL),
  (5, 11, 6, 'Implement Jira issue sync', 'Bidirectional sync between Momentum issues and Jira tickets, mapping status and priority fields correctly.', 'in_progress', 'high', 'feature', 13, NULL),
  (5, 11, 1, 'Add Linear integration', 'One-way import from Linear with field mapping and deduplication logic.', 'todo', 'medium', 'feature', 8, NULL),
  (6, 13, 5, 'Create Button component with all variants', 'Build Button component with primary, secondary, ghost, and destructive variants plus loading state.', 'done', 'medium', 'task', 3, '2024-02-28'),
  (6, 13, 2, 'Build DataTable component with sorting and pagination', 'Reusable table component with column sorting, multi-select, bulk actions, and pagination controls.', 'in_progress', 'medium', 'feature', 8, NULL),
  (1, NULL, NULL, 'Add WCAG 2.1 AA accessibility compliance', 'Audit the entire application for accessibility issues and implement fixes: proper ARIA labels, focus management, color contrast ratios.', 'backlog', 'high', 'enhancement', 13, NULL)
ON CONFLICT DO NOTHING;

-- Comments
INSERT INTO comments (issue_id, author_id, content) VALUES
  (1, 1, 'I can reproduce this consistently. Happens when the connection drops for more than 5 seconds and then recovers. The reconnect handler fires twice.'),
  (1, 3, 'Looking at the code, the issue is in WebSocketManager.reconnect() - it does not clear the existing reconnect timer before setting a new one. Simple fix.'),
  (1, 6, 'Can confirm - we see duplicate events in our monitoring. The fix should be straightforward: add `clearTimeout(this.reconnectTimer)` before the setTimeout call.'),
  (2, 2, 'Started implementation with DnD Kit. The column-to-column drag is working but within-column reordering needs the SortableContext wrapper adjusted.'),
  (2, 5, 'The animation on drop feels a bit laggy. Should we use the CSS transform approach instead of updating React state on every drag event?'),
  (3, 3, 'Created GIN index on tsvector column. Query time dropped from 340ms to 12ms on our test dataset of 50k issues. Ready for review.'),
  (3, 1, 'Excellent work Carol! The ts_rank ordering is a nice touch. One question: should we also index the comments table for full-text search?'),
  (4, 5, 'Mocked up three variations in Figma. The timeline-integrated version tests best with users. Sharing the link in the PR description.'),
  (6, 6, 'Cache is live. Dashboard load time improved from 1.2s to 180ms. Monitoring shows Redis hit rate at 94% after warmup.'),
  (8, 7, 'Implemented j/k/space/e/d shortcuts. Working on the command palette (cmd+k) as a bonus. Should have PR up by EOD.'),
  (9, 3, 'Fixed with a single JOIN query. Reduced DB queries from 47 to 1 per request. Performance in staging improved significantly.'),
  (9, 1, 'Great catch! This was causing 80% of our slow API responses. Nice optimization Carol.'),
  (11, 10, 'Claude API integrated and working. The summaries are high quality. Cost is about $0.002 per summary, which is well within budget.'),
  (12, 10, 'Data pipeline built. Training on 6 months of sprint data. Initial predictions are within 15% of actual velocity. Needs more data to improve.'),
  (14, 2, 'Tab bar complete with smooth animations. Using Reanimated 3 for the transitions. Added haptic feedback on tab change.'),
  (16, 6, 'Jira OAuth flow working. Field mapping table is complex - Jira has 40+ custom fields. Creating a mapping UI for admins to configure this.'),
  (18, 5, 'Button component shipped with all 4 variants, 3 sizes, loading state, icon support, and full accessibility attributes.'),
  (19, 2, 'DataTable is 80% done. Column drag-to-reorder is the tricky bit. Using a headless approach with @tanstack/react-table v8.'),
  (11, 1, 'Can we add a batch summarization endpoint? Some projects have 200+ issues to summarize on first import.'),
  (1, 2, 'I can add a unit test for this regression once the fix is in. Will add to the same PR.')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SaaS Challengers seed data (added 2026-05-14)
-- ============================================================================

INSERT INTO incumbents (name, category, flagship_product, annual_revenue_billions, paying_seats_millions, list_price_per_seat_usd, gross_margin_pct, code_lines_millions, rule_of_40, hq_country, founded_year, ticker, notes) VALUES
  ('Salesforce', 'CRM', 'Sales Cloud', 34.86, 9.50, 1800, 76.5, 14.0, 35.0, 'USA', 1999, 'CRM', 'Tower of acquisitions: Slack, Tableau, MuleSoft, ExactTarget.'),
  ('Workday', 'HR', 'Workday HCM', 7.26, 5.20, 720, 75.8, 6.5, 32.0, 'USA', 2005, 'WDAY', 'Dominant in Fortune 500 HCM; finance module growing.'),
  ('Adobe', 'Creative+DX', 'Creative Cloud', 19.41, 30.00, 660, 88.0, 10.0, 41.0, 'USA', 1982, 'ADBE', 'Creative Cloud + Experience Cloud + Document Cloud.'),
  ('ServiceNow', 'ITSM', 'Now Platform', 8.97, 1.80, 21000, 78.1, 7.0, 49.0, 'USA', 2004, 'NOW', 'Workflow platform; high ACV, sticky.'),
  ('Atlassian', 'DevTools', 'Jira', 4.36, 28.00, 96, 81.5, 38.0, 8.0, 'Australia', 2002, 'TEAM', 'Jira + Confluence + Bitbucket bundle.'),
  ('Oracle', 'ERP', 'Fusion Cloud ERP', 49.95, 12.00, 1500, 71.0, 35.0, 22.0, 'USA', 1977, 'ORCL', 'NetSuite + Fusion + legacy E-Business Suite.'),
  ('SAP', 'ERP', 'S/4HANA', 33.50, 13.00, 1400, 72.5, 50.0, 18.0, 'Germany', 1972, 'SAP', 'Heaviest legacy SaaS by code mass.'),
  ('Microsoft', 'Productivity', 'Microsoft 365', 245.00, 400.00, 264, 70.0, 60.0, 45.0, 'USA', 1975, 'MSFT', 'Bundled productivity + Teams + Copilot.'),
  ('Zoom', 'Communications', 'Zoom Workplace', 4.66, 220.00, 180, 75.4, 12.0, 14.0, 'USA', 2011, 'ZM', 'Post-COVID growth stalled; AI Companion is response.'),
  ('Zendesk', 'Support', 'Support Suite', 1.95, 1.60, 1200, 79.0, 5.0, 18.0, 'USA', 2007, NULL, 'Taken private by Hellman & Friedman in 2022.'),
  ('HubSpot', 'CRM', 'Customer Platform', 2.63, 0.21, 14500, 84.0, 6.5, 39.0, 'USA', 2006, 'HUBS', 'SMB-focused inbound stack.'),
  ('Splunk', 'Observability', 'Splunk Enterprise', 4.21, 0.025, 168000, 76.0, 9.0, 19.0, 'USA', 2003, NULL, 'Acquired by Cisco for $28B in 2024.'),
  ('Datadog', 'Observability', 'Datadog Platform', 2.68, 0.026, 103000, 80.4, 4.5, 49.0, 'USA', 2010, 'DDOG', 'Per-host metered; AI-spend optimisation upsell.'),
  ('Snowflake', 'Data', 'Data Cloud', 3.63, 0.010, 363000, 74.5, 4.0, 39.0, 'USA', 2012, 'SNOW', 'Consumption-based; pressured by Databricks + open table formats.'),
  ('Twilio', 'Comms-API', 'Programmable Messaging', 4.45, NULL, NULL, 50.5, 5.5, 16.0, 'USA', 2008, 'TWLO', 'Usage-priced; flow-builder layered on top.'),
  ('LegalZoom', 'Legal', 'LegalZoom Business Formations', 0.69, 0.30, 2200, 64.0, 1.5, 8.0, 'USA', 2001, 'LZ', 'Consumer/SMB legal; vulnerable to AI assistants.'),
  ('Thomson Reuters', 'Legal Research', 'Westlaw', 7.10, 0.50, 14200, 39.0, 18.0, 12.0, 'Canada', 1851, 'TRI', 'Westlaw + Practical Law; CoCounsel is the response.'),
  ('Five9', 'Contact Center', 'Five9 IVA', 0.91, 0.30, 3000, 60.3, 4.5, 9.0, 'USA', 2001, 'FIVN', 'Cloud contact center; AI agent threat from Cresta/Sierra.'),
  ('Cerner (Oracle Health)', 'Clinical', 'Millennium', 5.90, 1.10, 5350, 60.0, 22.0, NULL, 'USA', 1979, NULL, 'Acquired by Oracle 2022; clinician burnout #1 complaint.'),
  ('Confluence (Atlassian)', 'Knowledge', 'Confluence', 1.20, 12.00, 100, 80.0, 8.0, 12.0, 'Australia', 2004, NULL, 'Search quality the canonical complaint; Glean attacking head-on.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO challengers (name, incumbent_id, category, ai_native_thesis, pricing_model, arr_millions, total_funding_millions, last_valuation_billions, fte_per_million_arr, customer_count, flagship_customers, founded_year, stage, hq_country, notes) VALUES
  ('Glean', 20, 'Knowledge', 'AI-native enterprise search and assistant: indexes 100+ SaaS apps, rerank with permission-aware LLM. Confluence search has been broken for a decade.', 'per_seat', 100.00, 615.00, 7.20, 0.40, 250, 'Reddit, Pinterest, Databricks, Duolingo', 2019, 'series_d', 'USA', 'Hyper-growth from $20M to $100M ARR in 12 months.'),
  ('Harvey', 17, 'Legal Research', 'GPT-4 fine-tuned on case law and firm-specific contracts; targets BigLaw associate-hour displacement.', 'per_seat', 75.00, 506.00, 5.00, 1.20, 250, 'A&O Shearman, PwC, KKR', 2022, 'series_d', 'USA', 'Stanford-CS founders; OpenAI Startup Fund anchor.'),
  ('EvenUp', 17, 'Legal Research', 'AI for personal-injury demand letters; replaces paralegal+attorney time with structured demand packages.', 'per_action', 60.00, 235.00, 1.00, 1.80, 1500, 'Morgan & Morgan, Bisnar Chase', 2019, 'series_d', 'USA', '50,000+ demand packages shipped.'),
  ('Cresta', 18, 'Contact Center', 'Real-time AI coaching + autonomous voice agents for contact centers; lifts agent productivity 25%+ in known deployments.', 'outcome', 90.00, 270.00, 1.60, 0.80, 80, 'Vodafone, Cox, Hilton', 2017, 'series_c', 'USA', 'Co-founded by Sebastian Thrun.'),
  ('Hippocratic AI', 19, 'Clinical', 'Safety-focused clinical agent for low-acuity nursing tasks (med adherence, post-discharge, screening).', 'outcome', 18.00, 278.00, 1.64, 3.20, 25, 'Cincinnati Children s, WellSpan, Honor', 2023, 'series_b', 'USA', 'Constellation of 1500+ clinician reviewers.'),
  ('Sierra', 10, 'Support', 'Outcome-priced AI agents for customer experience; replaces tier-1 ticket queues end-to-end.', 'outcome', 50.00, 175.00, 4.50, 0.95, 60, 'WeightWatchers, SiriusXM, Sonos', 2023, 'series_b', 'USA', 'Bret Taylor (ex-Salesforce co-CEO) founded company.'),
  ('Decagon', 10, 'Support', 'AI customer support agents with grounded knowledge; high deflection rate on tier-1.', 'per_action', 30.00, 130.00, 1.50, 1.05, 100, 'Eventbrite, Substack, Bilt Rewards', 2023, 'series_b', 'USA', 'Outcome and per-resolution hybrid pricing.'),
  ('Cursor (Anysphere)', 5, 'DevTools', 'AI-native IDE; replaces JetBrains/VS Code + Copilot bundle with one agentic editor.', 'per_seat', 100.00, 173.00, 2.60, 0.30, 30000, 'Shopify, Instacart, OpenAI', 2022, 'series_b', 'USA', '$100M ARR in 12 months from launch.'),
  ('Cognition (Devin)', 5, 'DevTools', 'Autonomous software engineer; ticket-to-PR for SWE tasks. Direct seat replacement.', 'outcome', 36.00, 196.00, 2.00, 4.20, 100, 'Goldman Sachs, MongoDB', 2023, 'series_b', 'USA', 'Aggressive ACVs in F100 pilots.'),
  ('Magic Dev', 5, 'DevTools', '100M-token context long-context coding model + agent runner.', 'per_seat', 8.00, 465.00, 1.50, 0.85, 12, 'Google Cloud, CoreWeave', 2022, 'series_c', 'USA', 'Heavy compute partner play.'),
  ('Writer', 3, 'Creative+DX', 'Enterprise generative platform; replaces agency creative + Adobe DX workflow.', 'per_seat', 120.00, 326.00, 1.90, 0.55, 400, 'Accenture, Vanguard, Uber', 2020, 'series_c', 'USA', 'May Habib, ex-Qordoba pivot.'),
  ('Jasper', 3, 'Creative+DX', 'Brand-aware enterprise marketing copilot.', 'per_seat', 80.00, 131.00, 1.50, 1.10, 100000, 'IBM, HBO, Wix', 2021, 'series_a', 'USA', 'Brand voice fine-tuning; post-ChatGPT pricing pressure.'),
  ('Runway', 3, 'Creative+DX', 'Multimodal video gen model + creative app suite.', 'per_seat', 100.00, 545.00, 3.00, 0.45, 8000, 'New Balance, CBS, Lionsgate', 2018, 'series_d', 'USA', 'Gen-3 model state-of-the-art for short video.'),
  ('Lattice', 2, 'HR', 'Continuous performance + HRIS replacement, AI summaries on review cycles.', 'per_seat', 130.00, 332.00, 3.00, 0.80, 5000, 'Slack, Robinhood, Asana', 2015, 'series_f', 'USA', 'Adding HRIS core to attack Workday floor.'),
  ('Eightfold', 2, 'HR', 'Talent intelligence platform; replaces fragmented Workday recruiting workflows.', 'per_seat', 220.00, 410.00, 2.00, 0.95, 200, 'Bayer, Capital One, Vodafone', 2016, 'series_e', 'USA', 'Deep AI matching tech.'),
  ('Mercury', 7, 'ERP', 'Startup banking + bookkeeping (NetSuite-lite for sub-$50M revenue).', 'per_seat', 500.00, 152.00, 3.50, 0.60, 200000, 'Linear, Clay, Modal Labs', 2017, 'series_c', 'USA', 'Banking-led wedge into ERP.'),
  ('Rippling', 2, 'HR', 'Workforce platform: HRIS + IT + finance under one identity.', 'per_seat', 770.00, 1400.00, 16.80, 0.45, 25000, 'Stripe, Dropbox, Anduril', 2016, 'series_g', 'USA', 'Largest direct Workday seat competitor.'),
  ('Linear', 5, 'DevTools', 'Issue tracker rebuilt around speed and design; takes Jira seats at low end.', 'per_seat', 60.00, 60.00, 1.25, 0.40, 13000, 'OpenAI, Vercel, Ramp, Cash App', 2019, 'series_b', 'USA', 'Outsider pricing power per-seat.'),
  ('Vercel', 5, 'DevTools', 'Front-end Cloud + AI SDK; replaces Atlassian + Heroku style stacks.', 'per_seat', 200.00, 563.00, 3.25, 0.50, 100000, 'Adobe, Sonos, Loom', 2015, 'series_e', 'USA', 'Build the host, sell the framework.'),
  ('Pigment', 7, 'ERP', 'Business planning + FP&A replacing Anaplan and SAP planning modules.', 'per_seat', 50.00, 250.00, 1.20, 0.85, 250, 'Klarna, Webhelp, BNP Paribas', 2019, 'series_d', 'France', 'Strong EMEA enterprise traction.'),
  ('Tabular (Iceberg)', 14, 'Data', 'Apache Iceberg as a managed warehouse; commoditises Snowflake.', 'per_action', 12.00, 37.00, 0.50, 1.20, 60, 'Adobe Stock, Pinterest', 2021, 'series_a', 'USA', 'Acquired by Databricks in 2024.'),
  ('Tessl', 5, 'DevTools', 'AI-native spec-driven software development platform.', 'per_seat', 5.00, 125.00, 0.75, 1.20, 30, 'Stealth design partners', 2023, 'series_a', 'UK', 'Founded by Snyk founder Guy Podjarny.'),
  ('Pylon', 10, 'Support', 'B2B-native customer support tooling for Slack-first companies.', 'per_seat', 12.00, 27.00, 0.20, 0.70, 250, 'Hex, Modal, Cribl', 2022, 'seed', 'USA', 'Lean ICP focus.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pricing_models (name, description, typical_acv_usd, gross_margin_pct, scaling_curve, buyer_persona, notes) VALUES
  ('per_seat', 'Charge per named user. Legacy SaaS default. Predictable, but users are the wrong unit when AI replaces them.', 14400, 78.0, 'linear', 'IT / department head', 'Will compress as AI eliminates seats; risk of price drop.'),
  ('per_action', 'Charge per resolved ticket / generated doc / completed task.', 38000, 65.0, 'sublinear', 'Operations / Customer Success', 'Aligns with value but margin variable due to inference cost.'),
  ('outcome', 'Charge a percent of validated savings or contracted SLA achievement.', 250000, 55.0, 'superlinear', 'CFO / VP Ops', 'Strongest economic story; hardest to instrument.'),
  ('freemium', 'Self-serve free tier with paid usage above thresholds.', 1200, 82.0, 'linear', 'Developer / Prosumer', 'Cheap GTM but slow to land enterprise.'),
  ('hybrid', 'Per-seat platform fee + per-action usage upside.', 65000, 70.0, 'sublinear', 'CIO / Procurement', 'Common middle ground; emerging standard for 2026 enterprise.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO displacement_cases (challenger_id, customer_name, industry, pre_headcount, post_headcount, contract_acv_usd, loaded_fte_cost_usd, payback_months, evidence_url, reported_at, notes) VALUES
  (1, 'Reddit', 'Internet', 12, 5, 480000, 220000, 4.5, 'https://glean.com/case-studies/reddit', '2024-09-12', 'Internal knowledge search across Notion/Slack/Drive.'),
  (1, 'Pinterest', 'Internet', 28, 16, 1100000, 235000, 5.8, NULL, '2024-11-04', 'Replaced internal "Pinformation" search team build-out.'),
  (2, 'Allen & Overy', 'Legal', 350, 290, 6000000, 320000, 7.2, 'https://www.harvey.ai/customers', '2024-03-01', 'Associate hours redirected to higher-value work.'),
  (2, 'PwC', 'Professional Services', 1200, 1080, 24000000, 195000, 9.0, NULL, '2024-06-15', '4000 internal users; firm-specific clauses fine-tuned.'),
  (3, 'Morgan & Morgan', 'Legal', 220, 145, 4800000, 165000, 5.4, 'https://www.evenup.ai/case-studies', '2024-08-22', '60% reduction in paralegal hours per demand letter.'),
  (4, 'Vodafone', 'Telecom', 4500, 3600, 9000000, 92000, 11.0, NULL, '2024-04-18', 'Tier-1 voice agents augmented; AHT down 22%.'),
  (4, 'Hilton', 'Hospitality', 1600, 1280, 4200000, 78000, 7.2, NULL, '2024-09-30', 'Reservation contact center across multiple brands.'),
  (5, 'WellSpan Health', 'Healthcare', 50, 35, 850000, 145000, 8.8, NULL, '2024-12-10', 'Post-discharge follow-up nursing displaced.'),
  (6, 'WeightWatchers', 'Consumer', 320, 90, 5500000, 65000, 4.0, 'https://sierra.ai/customers', '2024-05-02', 'Outcome-priced; 70% of inbound deflected.'),
  (6, 'Sonos', 'Consumer Hardware', 180, 75, 2800000, 88000, 4.2, NULL, '2024-10-22', '6-week deployment; coverage of returns + warranty.'),
  (7, 'Eventbrite', 'Marketplace', 240, 110, 3100000, 72000, 4.8, NULL, '2024-11-15', '63% deflection on event-organiser tickets.'),
  (8, 'Shopify', 'E-Commerce', 1200, 1080, 18000000, 285000, 11.5, NULL, '2024-08-04', 'Org-wide rollout; SWE leverage measured in shipping velocity.'),
  (8, 'Instacart', 'E-Commerce', 800, 720, 10000000, 230000, 9.5, NULL, '2024-10-01', 'Internal IDE displacement of JetBrains seats.'),
  (9, 'Goldman Sachs', 'Finance', 600, 540, 14000000, 410000, 14.0, NULL, '2025-01-10', 'Devin pilot scaled to ops engineering team.'),
  (11, 'Accenture', 'Consulting', 1800, 1500, 22000000, 165000, 8.5, NULL, '2024-07-20', 'Internal proposal + marketing copy; brand-tuned.'),
  (14, 'Slack (Salesforce)', 'Software', 350, 280, 5000000, 215000, 9.0, NULL, '2024-09-18', 'Performance + HRIS combined; saved 70 HRBP seats.'),
  (17, 'Stripe', 'Fintech', 1200, 950, 14000000, 245000, 8.4, NULL, '2024-04-30', 'HRIS + IT + spend; absorbed Workday and Zip footprints.'),
  (17, 'Anduril', 'Defense', 600, 480, 7200000, 220000, 7.8, NULL, '2024-12-04', 'Replaced UKG, Okta, and Concur consolidation.'),
  (18, 'OpenAI', 'AI', 700, 580, 9500000, 290000, 9.5, NULL, '2024-09-22', 'Issue tracker; org-wide seat replacement of Jira.'),
  (19, 'Adobe', 'Software', 320, 240, 8500000, 235000, 6.6, NULL, '2024-11-12', 'Front-end platform; replaced internal CDN + Heroku stack.'),
  (16, 'Linear', 'Software', 12, 8, 350000, 195000, 5.0, NULL, '2024-08-12', 'Banking + bookkeeping; eliminated NetSuite seat.'),
  (12, 'Wix', 'Software', 120, 80, 1800000, 145000, 6.8, NULL, '2024-06-04', 'Marketing copy generation; reduced agency spend.'),
  (13, 'CBS', 'Media', 95, 60, 2200000, 175000, 7.4, NULL, '2025-02-18', 'Video gen for promo cuts; Adobe Premiere seats reduced.'),
  (15, 'Capital One', 'Finance', 240, 180, 4500000, 215000, 8.0, NULL, '2024-09-08', 'Talent matching replaced legacy ATS + Workday Recruiting.'),
  (1, 'Databricks', 'Data', 80, 50, 1900000, 245000, 6.4, NULL, '2025-03-04', 'Internal enterprise search rollout.')
ON CONFLICT DO NOTHING;

INSERT INTO switching_costs (incumbent_id, challenger_id, cost_category, description, one_time_cost_usd, duration_weeks, risk_level, blocker) VALUES
  (20, 1, 'data_migration', 'Re-index 100+ Confluence spaces with permission mapping; pages with deep tree structure.', 320000, 6.0, 'medium', FALSE),
  (20, 1, 'integration', 'SSO + SCIM + audit log integration with existing identity provider.', 75000, 2.0, 'low', FALSE),
  (20, 1, 'training', 'Rollout playbook for 1500 employees across 4 BUs.', 90000, 4.0, 'low', FALSE),
  (17, 2, 'data_migration', 'Import Westlaw research notes + firm contract library, fine-tune on 200k internal documents.', 850000, 14.0, 'high', FALSE),
  (17, 2, 'contract', 'Westlaw multi-year minimum commits with auto-renew; co-term risk.', 1200000, 0.0, 'high', TRUE),
  (17, 2, 'risk', 'Hallucination liability for client-billable work; needs human-in-loop review process.', 250000, 12.0, 'critical', FALSE),
  (18, 4, 'data_migration', 'Telephony + CRM data piped to Cresta real-time engine; PCI-DSS scope expansion.', 420000, 8.0, 'high', FALSE),
  (18, 4, 'integration', 'Genesys/Five9 SIP trunking integration with low-latency requirements.', 180000, 5.0, 'medium', FALSE),
  (10, 6, 'data_migration', 'Knowledge base export from Zendesk; clean up macros and intent taxonomy.', 220000, 4.0, 'medium', FALSE),
  (10, 6, 'training', 'Outcome-pricing instrumentation needs validated CSAT + deflection logging.', 120000, 6.0, 'medium', FALSE),
  (10, 6, 'contract', 'Zendesk Suite multi-year auto-renew penalty.', 500000, 0.0, 'high', TRUE),
  (5, 18, 'data_migration', 'Migrate 50k Jira issues with custom fields and screen schemes.', 95000, 3.0, 'medium', FALSE),
  (5, 18, 'integration', 'GitHub + Slack + Notion integrations re-wired against Linear API.', 30000, 1.0, 'low', FALSE),
  (5, 8, 'training', 'Engineering org transition to AI-native editor; existing keybindings + plugins.', 55000, 2.0, 'low', FALSE),
  (3, 11, 'training', 'Brand voice fine-tuning, marketing approval workflow re-design.', 60000, 4.0, 'medium', FALSE),
  (3, 13, 'integration', 'Replace Adobe Premiere/After Effects with Runway-based workflow + asset bridge.', 120000, 6.0, 'high', FALSE),
  (2, 14, 'data_migration', 'HRIS data migration; benefits + payroll provider re-mapping.', 410000, 12.0, 'high', FALSE),
  (2, 17, 'data_migration', 'Workday HCM + Recruiting export; org structure model translation.', 1100000, 24.0, 'critical', TRUE),
  (2, 17, 'risk', 'Compliance audit risk during transition for SOX/GDPR controls.', 600000, 16.0, 'high', FALSE),
  (7, 16, 'data_migration', 'NetSuite GL + AP/AR migration; chart of accounts mapping.', 280000, 8.0, 'high', FALSE),
  (12, 13, 'integration', 'Splunk to ATSC-style streaming pipeline for media workflow.', 90000, 5.0, 'medium', FALSE),
  (19, 5, 'integration', 'EHR FHIR integration + clinical workflow handoff to nurse-on-call.', 320000, 14.0, 'critical', FALSE),
  (8, 8, 'training', 'Engineering team onboarding to Cursor / agentic IDE.', 25000, 1.5, 'low', FALSE),
  (4, 18, 'integration', 'Replace ServiceNow Agile module with Linear; ITSM tickets stay in ServiceNow.', 75000, 3.0, 'medium', FALSE),
  (11, 16, 'data_migration', 'HubSpot CRM contacts to Mercury workspace; pipeline taxonomies merged.', 35000, 1.5, 'low', FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO moats (challenger_id, proprietary_data_score, vertical_workflow_score, network_effect_score, switching_cost_score, brand_score, regulatory_moat_score, composite_score, rationale, assessed_at) VALUES
  (1, 8, 8, 6, 5, 7, 4, 6.33, 'Glean: permission-aware index across customer SaaS stack is hard to clone; brand strong with eng leaders.', '2025-04-15'),
  (2, 9, 9, 4, 7, 8, 8, 7.50, 'Harvey: BigLaw partnerships + fine-tunes on case law create regulatory + workflow moat.', '2025-04-15'),
  (3, 8, 9, 6, 6, 6, 7, 7.00, 'EvenUp: 50k+ demand packages create proprietary outcome dataset.', '2025-04-15'),
  (4, 7, 8, 5, 6, 6, 5, 6.17, 'Cresta: telephony integration depth + agent training data.', '2025-04-15'),
  (5, 9, 9, 3, 7, 5, 9, 7.00, 'Hippocratic: clinical safety reviewers + healthcare compliance moat.', '2025-04-15'),
  (6, 7, 8, 6, 6, 7, 4, 6.33, 'Sierra: outcome-priced model + brand from Bret Taylor.', '2025-04-15'),
  (7, 6, 7, 5, 5, 5, 3, 5.17, 'Decagon: solid workflow depth but limited proprietary data lock-in.', '2025-04-15'),
  (8, 7, 7, 7, 5, 9, 2, 6.17, 'Cursor: developer brand network effect; switching to AI editor sticky once learned.', '2025-04-15'),
  (9, 6, 7, 4, 6, 7, 3, 5.50, 'Cognition (Devin): autonomous workflow novel; data moat still emerging.', '2025-04-15'),
  (11, 7, 7, 5, 5, 6, 4, 5.67, 'Writer: enterprise brand-voice tuning + workflow integrations.', '2025-04-15'),
  (14, 6, 6, 4, 4, 6, 3, 4.83, 'Lattice: solid product but HRIS depth not yet at Workday level.', '2025-04-15'),
  (16, 7, 6, 6, 7, 7, 6, 6.50, 'Mercury: banking + fintech workflow lock-in; banking license is regulatory moat.', '2025-04-15'),
  (17, 8, 8, 6, 8, 8, 5, 7.17, 'Rippling: identity-as-the-core differentiator; broadest displacement footprint.', '2025-04-15'),
  (18, 6, 8, 7, 5, 9, 2, 6.17, 'Linear: brand + design discipline + workflow opinion.', '2025-04-15'),
  (19, 7, 7, 8, 7, 8, 3, 6.67, 'Vercel: framework + cloud + AI SDK flywheel; Next.js gravitational center.', '2025-04-15'),
  (20, 6, 7, 3, 5, 5, 3, 4.83, 'Pigment: planning workflow depth in EMEA enterprise; brand still building US-side.', '2025-04-15'),
  (15, 7, 8, 5, 6, 6, 4, 6.00, 'Eightfold: talent matching graph + 1B+ profile data.', '2025-04-15'),
  (13, 8, 7, 6, 5, 8, 3, 6.17, 'Runway: state-of-the-art video gen + creator network.', '2025-04-15'),
  (12, 5, 6, 4, 4, 7, 2, 4.67, 'Jasper: brand voice tuning weakened by foundation-model price compression.', '2025-04-15'),
  (10, 7, 6, 3, 5, 4, 3, 4.67, 'Magic Dev: long-context tech is differentiator; commercial traction limited.', '2025-04-15'),
  (22, 6, 7, 4, 4, 5, 3, 4.83, 'Tessl: spec-driven approach novel; design-partner phase.', '2025-04-15'),
  (23, 5, 7, 4, 5, 4, 2, 4.50, 'Pylon: B2B support for Slack-first customers; tight ICP.', '2025-04-15')
ON CONFLICT DO NOTHING;
