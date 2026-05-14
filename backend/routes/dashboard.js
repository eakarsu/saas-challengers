const router = require('express').Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

// GET /api/dashboard/stats - aggregate KPIs and recent activity for landing dashboard
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const [
      activeProjects,
      openIssues,
      teamMembers,
      recentComments,
      currentSprints,
      recentActivity,
      issuesByStatus,
      issuesByPriority,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM projects WHERE status='active'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM issues WHERE status NOT IN ('done','cancelled')`),
      pool.query(`SELECT COUNT(*)::int AS count FROM team_members WHERE active=TRUE`),
      pool.query(`SELECT COUNT(*)::int AS count FROM comments WHERE created_at > NOW() - INTERVAL '7 days'`),
      pool.query(`
        SELECT s.id, s.name, s.goal, s.status, s.start_date, s.end_date, p.name AS project_name,
               (SELECT COUNT(*)::int FROM issues i WHERE i.sprint_id=s.id) AS total_issues,
               (SELECT COUNT(*)::int FROM issues i WHERE i.sprint_id=s.id AND i.status='done') AS done_issues,
               COALESCE((SELECT SUM(i.story_points)::int FROM issues i WHERE i.sprint_id=s.id), 0) AS total_points,
               COALESCE((SELECT SUM(i.story_points)::int FROM issues i WHERE i.sprint_id=s.id AND i.status='done'), 0) AS done_points
        FROM sprints s
        LEFT JOIN projects p ON s.project_id = p.id
        WHERE s.status='active'
        ORDER BY s.start_date DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT id, user_email, action, entity_type, entity_id, details, created_at
        FROM audit_log ORDER BY created_at DESC LIMIT 15
      `),
      pool.query(`SELECT status, COUNT(*)::int AS count FROM issues GROUP BY status ORDER BY count DESC`),
      pool.query(`SELECT priority, COUNT(*)::int AS count FROM issues GROUP BY priority ORDER BY count DESC`),
    ]);

    // Compute aggregate sprint progress (weighted by points across active sprints)
    const sprintRows = currentSprints.rows;
    const totalPts = sprintRows.reduce((a, s) => a + (s.total_points || 0), 0);
    const donePts = sprintRows.reduce((a, s) => a + (s.done_points || 0), 0);
    const sprintProgressPct = totalPts > 0 ? Math.round((donePts / totalPts) * 100) : 0;

    res.json({
      kpis: {
        active_projects: activeProjects.rows[0].count,
        open_issues: openIssues.rows[0].count,
        team_members: teamMembers.rows[0].count,
        recent_comments: recentComments.rows[0].count,
        active_sprints: sprintRows.length,
        sprint_progress_pct: sprintProgressPct,
      },
      current_sprints: sprintRows,
      recent_activity: recentActivity.rows,
      issues_by_status: issuesByStatus.rows,
      issues_by_priority: issuesByPriority.rows,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
