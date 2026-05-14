// SaaS Challengers: Moat Analyzer
// Scores defensive moats for AI-native challengers across six dimensions:
// proprietary data, vertical workflow, network effect, switching cost,
// brand, and regulatory.
//
// Routes:
//   GET    /api/moats                            list assessments
//   GET    /api/moats/:id
//   POST   /api/moats                            create assessment
//   PUT    /api/moats/:id
//   DELETE /api/moats/:id
//   POST   /api/moats/score                      compute composite without saving
//   GET    /api/moats/leaderboard
//   GET    /api/moats/dimension-averages

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

const DIMENSIONS = [
  'proprietary_data_score',
  'vertical_workflow_score',
  'network_effect_score',
  'switching_cost_score',
  'brand_score',
  'regulatory_moat_score'
];

function computeComposite(row) {
  const vals = DIMENSIONS.map(d => Number(row[d] || 0));
  const sum = vals.reduce((s, v) => s + v, 0);
  return +(sum / vals.length).toFixed(2);
}

function classify(score) {
  if (score >= 7.5) return 'fortress — defensible long-term';
  if (score >= 6) return 'durable — multi-year defensibility';
  if (score >= 4.5) return 'emerging — moat under construction';
  if (score >= 3) return 'shallow — high competitive risk';
  return 'no moat — feature-level differentiation only';
}

router.get('/', async (req, res) => {
  try {
    const { challenger_id } = req.query;
    const wh = []; const p = [];
    if (challenger_id) { p.push(challenger_id); wh.push(`m.challenger_id = $${p.length}`); }
    const r = await pool.query(`
      SELECT m.*, c.name AS challenger_name, c.category, c.arr_millions,
             i.name AS incumbent_name
        FROM moats m
        LEFT JOIN challengers c ON c.id = m.challenger_id
        LEFT JOIN incumbents i ON i.id = c.incumbent_id
        ${wh.length ? 'WHERE ' + wh.join(' AND ') : ''}
       ORDER BY m.composite_score DESC NULLS LAST
    `, p);
    res.json(r.rows.map(row => ({
      ...row,
      verdict: classify(Number(row.composite_score || 0))
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.id AS challenger_id, c.name AS challenger_name, c.category,
             c.arr_millions, m.composite_score, m.proprietary_data_score,
             m.vertical_workflow_score, m.network_effect_score,
             m.switching_cost_score, m.brand_score, m.regulatory_moat_score
        FROM challengers c
        LEFT JOIN moats m ON m.challenger_id = c.id
       WHERE m.id IS NOT NULL
       ORDER BY m.composite_score DESC NULLS LAST
       LIMIT 50
    `);
    res.json(r.rows.map(row => ({ ...row, verdict: classify(Number(row.composite_score || 0)) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dimension-averages', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT AVG(proprietary_data_score) AS proprietary_data,
             AVG(vertical_workflow_score) AS vertical_workflow,
             AVG(network_effect_score) AS network_effect,
             AVG(switching_cost_score) AS switching_cost,
             AVG(brand_score) AS brand,
             AVG(regulatory_moat_score) AS regulatory,
             AVG(composite_score) AS composite,
             COUNT(*) AS assessments
        FROM moats
    `);
    const row = r.rows[0];
    res.json({
      proprietary_data: +Number(row.proprietary_data || 0).toFixed(2),
      vertical_workflow: +Number(row.vertical_workflow || 0).toFixed(2),
      network_effect: +Number(row.network_effect || 0).toFixed(2),
      switching_cost: +Number(row.switching_cost || 0).toFixed(2),
      brand: +Number(row.brand || 0).toFixed(2),
      regulatory: +Number(row.regulatory || 0).toFixed(2),
      composite: +Number(row.composite || 0).toFixed(2),
      assessments: Number(row.assessments)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compute a composite score from raw inputs without persisting.
router.post('/score', async (req, res) => {
  try {
    const required = DIMENSIONS;
    for (const k of required) {
      if (req.body[k] === undefined) return res.status(400).json({ error: `${k} required` });
      const v = Number(req.body[k]);
      if (Number.isNaN(v) || v < 0 || v > 10) {
        return res.status(400).json({ error: `${k} must be a number 0..10` });
      }
    }
    const composite = computeComposite(req.body);
    res.json({
      composite_score: composite,
      verdict: classify(composite),
      dimensions: required.reduce((acc, k) => { acc[k] = Number(req.body[k]); return acc; }, {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT m.*, c.name AS challenger_name FROM moats m
        LEFT JOIN challengers c ON c.id = m.challenger_id
       WHERE m.id = $1
    `, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'moat not found' });
    res.json({ ...r.rows[0], verdict: classify(Number(r.rows[0].composite_score || 0)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { challenger_id, rationale, assessed_at } = req.body || {};
    if (!challenger_id) return res.status(400).json({ error: 'challenger_id required' });
    for (const k of DIMENSIONS) {
      if (req.body[k] === undefined) return res.status(400).json({ error: `${k} required` });
      const v = Number(req.body[k]);
      if (Number.isNaN(v) || v < 0 || v > 10) {
        return res.status(400).json({ error: `${k} must be 0..10` });
      }
    }
    const composite = computeComposite(req.body);
    const r = await pool.query(`
      INSERT INTO moats
        (challenger_id, proprietary_data_score, vertical_workflow_score,
         network_effect_score, switching_cost_score, brand_score,
         regulatory_moat_score, composite_score, rationale, assessed_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      challenger_id,
      req.body.proprietary_data_score, req.body.vertical_workflow_score,
      req.body.network_effect_score, req.body.switching_cost_score,
      req.body.brand_score, req.body.regulatory_moat_score,
      composite, rationale || null, assessed_at || null
    ]);
    res.status(201).json({ ...r.rows[0], verdict: classify(composite) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = [...DIMENSIONS, 'rationale', 'assessed_at'];
    const sets = []; const vals = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { vals.push(req.body[f]); sets.push(`${f} = $${vals.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'no fields to update' });
    // recompute composite if any dimension changed
    if (DIMENSIONS.some(d => req.body[d] !== undefined)) {
      const current = await pool.query('SELECT * FROM moats WHERE id = $1', [req.params.id]);
      if (!current.rows[0]) return res.status(404).json({ error: 'moat not found' });
      const merged = { ...current.rows[0], ...req.body };
      const composite = computeComposite(merged);
      vals.push(composite); sets.push(`composite_score = $${vals.length}`);
    }
    vals.push(req.params.id);
    const r = await pool.query(
      `UPDATE moats SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ ...r.rows[0], verdict: classify(Number(r.rows[0].composite_score || 0)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM moats WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
