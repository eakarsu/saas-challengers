const router = require('express').Router();
const pool = require('../db');
const verifyToken = require("../middleware/auth");

router.get('/', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, tm.name AS author_name, tm.avatar_color,
        i.title AS issue_title, i.project_id
      FROM comments c
      LEFT JOIN team_members tm ON c.author_id = tm.id
      LEFT JOIN issues i ON c.issue_id = i.id
      ORDER BY c.created_at DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, tm.name AS author_name, tm.avatar_color, i.title AS issue_title
      FROM comments c
      LEFT JOIN team_members tm ON c.author_id = tm.id
      LEFT JOIN issues i ON c.issue_id = i.id
      WHERE c.id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  const { issue_id, author_id, content } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO comments(issue_id,author_id,content) VALUES($1,$2,$3) RETURNING *`,
      [issue_id, author_id||null, content]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { issue_id, author_id, content } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE comments SET issue_id=$1,author_id=$2,content=$3 WHERE id=$4 RETURNING *`,
      [issue_id, author_id||null, content, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
