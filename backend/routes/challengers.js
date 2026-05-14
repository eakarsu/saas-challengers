// SaaS Challengers: Challenger registry
// Tracks AI-native challengers (Glean, Harvey, Cresta, Hippocratic, Sierra,
// Cursor, Cognition, Rippling, Linear, Vercel, ...) with ARR, funding,
// pricing model, FTE-displacement ratio, and stage.
//
// Routes:
//   GET    /api/challengers
//   GET    /api/challengers/:id
//   POST   /api/challengers
//   PUT    /api/challengers/:id
//   DELETE /api/challengers/:id
//   GET    /api/challengers/stage-mix
//   GET    /api/challengers/pricing-mix
//   GET    /api/challengers/efficiency-leaderboard
//   GET    /api/challengers/:id/displacement
//   GET    /api/challengers/:id/moat

const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { incumbent_id, category, stage, pricing_model } = req.query;
    const wh = []; const p = [];
    if (incumbent_id)   { p.push(incumbent_id);   wh.push(`c.incumbent_id = $${p.length}`); }
    if (category)       { p.push(category);       wh.push(`c.category = $${p.length}`); }
    if (stage)          { p.push(stage);          wh.push(`c.stage = $${p.length}`); }
    if (pricing_model)  { p.push(pricing_model);  wh.push(`c.pricing_model = $${p.length}`); }
    const r = await pool.query(`
      SELECT c.*,
             i.name AS incumbent_name,
             i.category AS incumbent_category,
             i.annual_revenue_billions AS incumbent_revenue_b,
             (SELECT COUNT(*) FROM displacement_cases dc WHERE dc.challenger_id = c.id) AS case_count,
             (SELECT composite_score FROM moats m WHERE m.challenger_id = c.id ORDER BY id DESC LIMIT 1) AS moat_score
        FROM challengers c
        LEFT JOIN incumbents i ON i.id = c.incumbent_id
        ${wh.length ? 'WHERE ' + wh.join(' AND ') : ''}
       ORDER BY c.arr_millions DESC NULLS LAST, c.name ASC
    `, p);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stage-mix', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT COALESCE(stage, 'unknown') AS stage,
             COUNT(*) AS count,
             COALESCE(SUM(arr_millions), 0) AS arr_m,
             COALESCE(SUM(total_funding_millions), 0) AS funding_m,
             COALESCE(AVG(fte_per_million_arr), 0) AS avg_fte_per_m,
             COALESCE(SUM(customer_count), 0) AS total_customers
        FROM challengers
       GROUP BY stage
       ORDER BY funding_m DESC
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pricing-mix', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT COALESCE(c.pricing_model, 'unknown') AS pricing_model,
             COUNT(*) AS count,
             COALESCE(SUM(c.arr_millions), 0) AS arr_m,
             COALESCE(AVG(c.arr_millions), 0) AS avg_arr_m,
             COALESCE(AVG(c.fte_per_million_arr), 0) AS avg_fte_per_m,
             pm.gross_margin_pct AS model_gm_pct,
             pm.typical_acv_usd AS model_typical_acv_usd
        FROM challengers c
        LEFT JOIN pricing_models pm ON pm.name = c.pricing_model
       GROUP BY c.pricing_model, pm.gross_margin_pct, pm.typical_acv_usd
       ORDER BY arr_m DESC
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/efficiency-leaderboard', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.id, c.name, c.incumbent_id, i.name AS incumbent_name,
             c.arr_millions, c.total_funding_millions, c.last_valuation_billions,
             c.fte_per_million_arr, c.customer_count, c.stage, c.pricing_model
        FROM challengers c
        LEFT JOIN incumbents i ON i.id = c.incumbent_id
       WHERE c.arr_millions IS NOT NULL AND c.total_funding_millions IS NOT NULL AND c.total_funding_millions > 0
    `);
    const rows = r.rows.map(row => {
      const arr = Number(row.arr_millions || 0);
      const funding = Number(row.total_funding_millions || 0);
      const val = Number(row.last_valuation_billions || 0) * 1000;
      const cust = Number(row.customer_count || 0);
      return {
        ...row,
        capital_efficiency: funding > 0 ? +((arr / funding) * 100).toFixed(2) : null,
        revenue_multiple: arr > 0 ? +(val / arr).toFixed(2) : null,
        arr_per_customer_k: cust > 0 ? +((arr * 1000) / cust).toFixed(2) : null
      };
    }).sort((a, b) => (b.capital_efficiency || 0) - (a.capital_efficiency || 0));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.*, i.name AS incumbent_name, i.category AS incumbent_category,
             i.annual_revenue_billions AS incumbent_revenue_b,
             i.list_price_per_seat_usd AS incumbent_seat_price
        FROM challengers c
        LEFT JOIN incumbents i ON i.id = c.incumbent_id
       WHERE c.id = $1
    `, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'challenger not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/displacement', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT * FROM displacement_cases
       WHERE challenger_id = $1
       ORDER BY reported_at DESC NULLS LAST, id DESC
    `, [req.params.id]);
    const cases = r.rows;
    const totalDisplaced = cases.reduce((s, c) =>
      s + Math.max(0, Number(c.pre_headcount || 0) - Number(c.post_headcount || 0)), 0);
    const totalACV = cases.reduce((s, c) => s + Number(c.contract_acv_usd || 0), 0);
    const avgPayback = cases.length
      ? +(cases.reduce((s, c) => s + Number(c.payback_months || 0), 0) / cases.length).toFixed(2)
      : null;
    res.json({
      cases,
      summary: {
        total_cases: cases.length,
        total_displaced_fte: totalDisplaced,
        total_acv_usd: totalACV,
        avg_payback_months: avgPayback
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/moat', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT * FROM moats WHERE challenger_id = $1 ORDER BY id DESC LIMIT 1
    `, [req.params.id]);
    res.json(r.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const f = [
      'name','incumbent_id','category','ai_native_thesis','pricing_model',
      'arr_millions','total_funding_millions','last_valuation_billions',
      'fte_per_million_arr','customer_count','flagship_customers',
      'founded_year','stage','hq_country','status','notes'
    ];
    if (!req.body?.name) return res.status(400).json({ error: 'name required' });
    const vals = f.map(k => req.body[k] === undefined ? null : req.body[k]);
    const placeholders = f.map((_, i) => `$${i + 1}`).join(',');
    const r = await pool.query(
      `INSERT INTO challengers (${f.join(',')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'name already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = [
      'name','incumbent_id','category','ai_native_thesis','pricing_model',
      'arr_millions','total_funding_millions','last_valuation_billions',
      'fte_per_million_arr','customer_count','flagship_customers',
      'founded_year','stage','hq_country','status','notes'
    ];
    const sets = []; const vals = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { vals.push(req.body[f]); sets.push(`${f} = $${vals.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'no fields to update' });
    vals.push(req.params.id);
    const r = await pool.query(
      `UPDATE challengers SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'challenger not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM challengers WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'challenger not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
