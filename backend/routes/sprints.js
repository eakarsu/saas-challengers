const router = require('express').Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, p.name AS project_name,
        (SELECT COUNT(*) FROM issues i WHERE i.sprint_id = s.id) AS issue_count,
        (SELECT COALESCE(SUM(story_points),0) FROM issues i WHERE i.sprint_id = s.id) AS total_points,
        (SELECT COALESCE(SUM(story_points),0) FROM issues i WHERE i.sprint_id = s.id AND i.status='done') AS completed_points
      FROM sprints s
      LEFT JOIN projects p ON s.project_id = p.id
      ORDER BY s.start_date DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, p.name AS project_name FROM sprints s
      LEFT JOIN projects p ON s.project_id = p.id WHERE s.id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  const { project_id, name, goal, status, start_date, end_date, velocity } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO sprints(project_id,name,goal,status,start_date,end_date,velocity)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [project_id, name, goal, status||'planned', start_date||null, end_date||null, velocity||0]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { project_id, name, goal, status, start_date, end_date, velocity } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE sprints SET project_id=$1,name=$2,goal=$3,status=$4,start_date=$5,end_date=$6,velocity=$7 WHERE id=$8 RETURNING *`,
      [project_id, name, goal, status, start_date||null, end_date||null, velocity||0, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM sprints WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
