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
