const router = require('express').Router();
const pool = require('../db');
const verifyToken = require("../middleware/auth");

router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT tm.*,
        (SELECT COUNT(*) FROM issues i WHERE i.assignee_id = tm.id) AS total_issues,
        (SELECT COUNT(*) FROM issues i WHERE i.assignee_id = tm.id AND i.status != 'done') AS open_issues
      FROM team_members tm ORDER BY tm.name`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM team_members WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  const { name, email, role, avatar_color, department, time_zone, joined_date, active, github_handle } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO team_members(name,email,role,avatar_color,department,time_zone,joined_date,active,github_handle)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, email, role, avatar_color||'bg-violet-500', department, time_zone, joined_date||null, active !== false, github_handle]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { name, email, role, avatar_color, department, time_zone, joined_date, active, github_handle } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE team_members SET name=$1,email=$2,role=$3,avatar_color=$4,department=$5,time_zone=$6,joined_date=$7,active=$8,github_handle=$9 WHERE id=$10 RETURNING *`,
      [name, email, role, avatar_color, department, time_zone, joined_date||null, active, github_handle, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM team_members WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
