const router = require('express').Router();
const verifyToken = require('../middleware/auth');

async function callAI(userPrompt, systemPrompt = '') {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    const err = new Error('AI service unavailable: OPENROUTER_API_KEY not configured');
    err.status = 503;
    throw err;
  }
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost', 'X-Title': 'Momentum' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', messages: [...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []), { role: 'user', content: userPrompt }] })
  });
  if (!r.ok) {
    const err = new Error(`AI service unavailable (status ${r.status})`);
    err.status = 503;
    throw err;
  }
  return (await r.json()).choices?.[0]?.message?.content || 'AI unavailable';
}

function aiError(e, res) {
  const status = e.status || 500;
  res.status(status).json({ error: e.message });
}

router.post('/sprint-planning', verifyToken, async (req, res) => {
  const { sprint, issues, team } = req.body;
  try {
    const result = await callAI(
      `Analyze this sprint and provide planning recommendations.\n\nSprint: ${JSON.stringify(sprint)}\nBacklog Issues: ${JSON.stringify(issues?.slice(0,15))}\nTeam: ${JSON.stringify(team?.slice(0,10))}\n\nProvide:\n1. **Sprint Goal Assessment** - is the goal achievable given team capacity?\n2. **Recommended Issues** - which 5-8 issues to include based on priority and points\n3. **Capacity Analysis** - story points by team member given their current load\n4. **Risk Factors** - blockers, dependencies, or team availability concerns\n5. **Definition of Done** - suggest specific acceptance criteria for this sprint`,
      'You are an expert Scrum Master and agile coach specializing in sprint planning optimization.'
    );
    res.json({ result });
  } catch (e) { aiError(e, res); }
});

router.post('/issue-triage', verifyToken, async (req, res) => {
  const { issue, team, project } = req.body;
  try {
    const result = await callAI(
      `Triage this issue and suggest how to handle it.\n\nIssue: ${JSON.stringify(issue)}\nProject: ${JSON.stringify(project)}\nAvailable Team: ${JSON.stringify(team?.slice(0,8))}\n\nProvide:\n1. **Priority Assessment** - recommended priority (critical/high/medium/low) with reasoning\n2. **Type Classification** - bug, feature, enhancement, task, or tech debt\n3. **Effort Estimate** - story points (1,2,3,5,8,13) with explanation\n4. **Suggested Assignee** - best team member based on role and workload\n5. **Acceptance Criteria** - 3-5 specific, testable criteria for this issue\n6. **Related Issues** - potential dependencies or related work to consider`,
      'You are a senior product manager and tech lead specializing in issue triage and project estimation.'
    );
    res.json({ result });
  } catch (e) { aiError(e, res); }
});

router.post('/velocity-analysis', verifyToken, async (req, res) => {
  const { sprints, team } = req.body;
  try {
    const result = await callAI(
      `Analyze team velocity trends and provide insights.\n\nSprint History: ${JSON.stringify(sprints)}\nTeam: ${JSON.stringify(team?.slice(0,10))}\n\nProvide:\n1. **Velocity Trend** - is velocity improving, declining, or stable?\n2. **Predictability Score** - how consistent is delivery (1-10)?\n3. **Capacity Insights** - average capacity and variance across sprints\n4. **Anomaly Detection** - sprints with unusual velocity and likely causes\n5. **Forecast** - predicted velocity for next 3 sprints with confidence intervals\n6. **Improvement Actions** - specific recommendations to improve velocity and predictability`,
      'You are a data-driven agile coach specializing in engineering team performance metrics.'
    );
    res.json({ result });
  } catch (e) { aiError(e, res); }
});

router.post('/project-health', verifyToken, async (req, res) => {
  const { project, issues, sprints, team } = req.body;
  try {
    const result = await callAI(
      `Assess the overall health of this software project.\n\nProject: ${JSON.stringify(project)}\nOpen Issues: ${JSON.stringify(issues?.slice(0,20))}\nRecent Sprints: ${JSON.stringify(sprints?.slice(0,5))}\nTeam: ${JSON.stringify(team?.slice(0,10))}\n\nProvide:\n1. **Health Score** - overall project health (1-10) with breakdown by dimension\n2. **Schedule Risk** - likelihood of on-time delivery based on current progress\n3. **Technical Debt Assessment** - estimated debt level and impact\n4. **Team Health** - workload balance, bottlenecks, bus factor risks\n5. **Top 3 Risks** - most critical risks with mitigation strategies\n6. **30-Day Action Plan** - prioritized actions to improve project health`,
      'You are a senior engineering manager and project health specialist with expertise in delivery risk assessment.'
    );
    res.json({ result });
  } catch (e) { aiError(e, res); }
});

// ===== New AI features =====

// 1. Sprint Risk Predictor: predicts likelihood of sprint failure with risk factors
router.post('/sprint-risk', verifyToken, async (req, res) => {
  const { sprint, issues, team } = req.body;
  try {
    const result = await callAI(
      `Predict the risk of this sprint missing its goal.\n\nSprint: ${JSON.stringify(sprint)}\nIssues in Sprint: ${JSON.stringify(issues?.slice(0,20))}\nTeam: ${JSON.stringify(team?.slice(0,10))}\n\nProvide:\n1. **Risk Score** - overall risk (low/medium/high/critical) with numeric 0-100\n2. **Top Risk Factors** - 3-5 specific factors increasing sprint risk\n3. **At-Risk Issues** - issues most likely to slip with reasoning\n4. **Capacity Gap** - point gap between commitment and likely delivery\n5. **Mitigation Plan** - 3 concrete actions to reduce risk this sprint\n6. **Confidence** - confidence in this prediction (low/medium/high)`,
      'You are an expert agile delivery risk analyst with deep experience in software sprint forecasting.'
    );
    res.json({ result });
  } catch (e) { aiError(e, res); }
});

// 2. Story Point Estimator: estimates story points for an issue
router.post('/story-point-estimate', verifyToken, async (req, res) => {
  const { issue, similarIssues, project } = req.body;
  try {
    const result = await callAI(
      `Estimate story points for this issue using the Fibonacci scale (1,2,3,5,8,13,21).\n\nIssue: ${JSON.stringify(issue)}\nProject Context: ${JSON.stringify(project)}\nSimilar Past Issues: ${JSON.stringify(similarIssues?.slice(0,10))}\n\nProvide:\n1. **Recommended Story Points** - single Fibonacci number with rationale\n2. **Confidence Level** - low/medium/high with reasoning\n3. **Effort Breakdown** - design / implementation / testing / review effort\n4. **Comparable Issues** - which past issues this resembles and their points\n5. **Hidden Complexity** - non-obvious complexity factors to consider\n6. **Range** - lower and upper bound estimate (e.g. 3-8)`,
      'You are a senior engineer who estimates work precisely using historical data and complexity analysis.'
    );
    res.json({ result });
  } catch (e) { aiError(e, res); }
});

// 3. Similar Issue Finder: finds related issues and suggests deduplication / linking
router.post('/similar-issues', verifyToken, async (req, res) => {
  const { issue, candidates } = req.body;
  try {
    const result = await callAI(
      `Find issues similar to the target issue.\n\nTarget Issue: ${JSON.stringify(issue)}\nCandidate Issues: ${JSON.stringify(candidates?.slice(0,30))}\n\nProvide:\n1. **Top Similar Issues** - up to 5 with similarity reason and similarity score (0-100)\n2. **Possible Duplicates** - issues that may be duplicates with confidence\n3. **Related (not duplicate)** - issues that should be linked but kept separate\n4. **Recommended Action** - close-as-duplicate / link / leave-alone for each\n5. **Common Theme** - any recurring theme across the related issues`,
      'You are an issue triage specialist skilled at finding semantic duplicates and related work in issue trackers.'
    );
    res.json({ result });
  } catch (e) { aiError(e, res); }
});

// 4. Blocker Classifier: detects whether an issue is blocked and classifies the blocker type
router.post('/blocker-classify', verifyToken, async (req, res) => {
  const { issue, comments, related } = req.body;
  try {
    const result = await callAI(
      `Determine whether this issue is blocked, and if so classify the blocker.\n\nIssue: ${JSON.stringify(issue)}\nRecent Comments: ${JSON.stringify(comments?.slice(0,20))}\nRelated Issues: ${JSON.stringify(related?.slice(0,10))}\n\nProvide:\n1. **Blocked Status** - yes / no / partial with confidence\n2. **Blocker Type** - one of: external-dependency / waiting-on-team / technical / unclear-requirement / resource / approval / other\n3. **Blocker Description** - one-sentence summary of the blocker if any\n4. **Days Stuck Estimate** - how long it appears to have been blocked\n5. **Unblocking Action** - the single most important next step to unblock\n6. **Owner of Unblock** - who should drive the unblock`,
      'You are a delivery manager skilled at reading issue activity and identifying blockers and stalls.'
    );
    res.json({ result });
  } catch (e) { aiError(e, res); }
});

// 5. Retro Insights Generator: generates retrospective insights from recent sprint data
router.post('/retro-insights', verifyToken, async (req, res) => {
  const { sprint, issues, comments, team } = req.body;
  try {
    const result = await callAI(
      `Generate retrospective insights for this sprint.\n\nSprint: ${JSON.stringify(sprint)}\nIssues: ${JSON.stringify(issues?.slice(0,25))}\nRecent Comments: ${JSON.stringify(comments?.slice(0,15))}\nTeam: ${JSON.stringify(team?.slice(0,10))}\n\nProvide:\n1. **What Went Well** - 3-5 specific positives backed by data\n2. **What Went Poorly** - 3-5 specific negatives with evidence\n3. **Surprises** - unexpected patterns or outcomes\n4. **Process Improvements** - 3 concrete process changes to try next sprint\n5. **Team Health Signals** - workload, communication, morale signals\n6. **Action Items** - 3-5 owned, time-boxed action items in format "[Owner] [Action] [By when]"`,
      'You are a thoughtful agile coach who runs data-driven retrospectives and turns observations into actionable improvements.'
    );
    res.json({ result });
  } catch (e) { aiError(e, res); }
});

module.exports = router;
