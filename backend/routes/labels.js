const router = require('express').Router();
const pool = require('../db');
const verifyToken = require("../middleware/auth");

router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.*, p.name AS project_name,
        (SELECT COUNT(*) FROM issue_labels il WHERE il.label_id = l.id) AS usage_count
      FROM labels l
      LEFT JOIN projects p ON l.project_id = p.id
      ORDER BY l.name`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.*, p.name AS project_name FROM labels l
      LEFT JOIN projects p ON l.project_id = p.id WHERE l.id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  const { name, color, description, project_id } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO labels(name,color,description,project_id) VALUES($1,$2,$3,$4) RETURNING *`,
      [name, color||'bg-gray-500', description, project_id||null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { name, color, description, project_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE labels SET name=$1,color=$2,description=$3,project_id=$4 WHERE id=$5 RETURNING *`,
      [name, color, description, project_id||null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM labels WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
