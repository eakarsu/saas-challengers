require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/sprints', require('./routes/sprints'));
app.use('/api/team', require('./routes/team'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/labels', require('./routes/labels'));
app.use('/api/utils', require('./routes/utils'));
app.use('/api/admin', require('./routes/sample_data'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 3012;
app.listen(PORT, () => console.log(`Momentum backend running on port ${PORT}`));
app.use('/api/gap-ai-auto-pr-from-issue', require('./routes/gap-ai-auto-pr-from-issue'));
app.use('/api/gap-ai-standup-summarizer', require('./routes/gap-ai-standup-summarizer'));
app.use('/api/gap-ai-cycle-time-explainer', require('./routes/gap-ai-cycle-time-explainer'));
app.use('/api/gap-ai-dependency-graph', require('./routes/gap-ai-dependency-graph'));
app.use('/api/gap-ai-agent-executor', require('./routes/gap-ai-agent-executor'));
app.use('/api/gap-nonai-webhook-ingest', require('./routes/gap-nonai-webhook-ingest'));
app.use('/api/gap-nonai-websocket-events', require('./routes/gap-nonai-websocket-events'));
app.use('/api/gap-nonai-keyboard-palette', require('./routes/gap-nonai-keyboard-palette'));
app.use('/api/gap-nonai-customer-portal', require('./routes/gap-nonai-customer-portal'));
app.use('/api/gap-nonai-git-integration', require('./routes/gap-nonai-git-integration'));
app.use('/api/gap-nonai-sso-integration', require('./routes/gap-nonai-sso-integration'));
app.use('/api/cf-agent-executable-spec', require('./routes/cf-agent-executable-spec'));
app.use('/api/cf-plan-from-brief', require('./routes/cf-plan-from-brief'));
app.use('/api/cf-auto-retros', require('./routes/cf-auto-retros'));
app.use('/api/cf-code-aware-similarity', require('./routes/cf-code-aware-similarity'));
app.use('/api/cf-github-sync', require('./routes/cf-github-sync'));

// SaaS Challengers domain routes (added 2026-05-14)
app.use('/api/incumbents', require('./routes/incumbents'));
app.use('/api/challengers', require('./routes/challengers'));
app.use('/api/displacement', require('./routes/displacement'));
app.use('/api/switching', require('./routes/switching'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/moats', require('./routes/moats'));
