// SaaS Challengers: Incumbent registry
// Tracks the legacy SaaS giants (Salesforce, Workday, Adobe, ServiceNow, etc.)
// with real revenue, paid-seat estimates, list pricing, and rule-of-40 metrics.
//
// Routes:
//   GET    /api/incumbents
//   GET    /api/incumbents/:id
//   POST   /api/incumbents
//   PUT    /api/incumbents/:id
//   DELETE /api/incumbents/:id
//   GET    /api/incumbents/category-map
//   GET    /api/incumbents/vulnerability-ranking
//   GET    /api/incumbents/:id/challengers

const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require("../middleware/auth");

router.use(verifyToken);

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT i.*,
             (SELECT COUNT(*) FROM challengers c WHERE c.incumbent_id = i.id) AS active_challengers,
             (SELECT COALESCE(SUM(c.arr_millions), 0) FROM challengers c WHERE c.incumbent_id = i.id) AS attacker_arr_millions
        FROM incumbents i
       ORDER BY i.annual_revenue_billions DESC NULLS LAST, i.name ASC
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/category-map', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT category,
             COUNT(*)                                                 AS incumbent_count,
             SUM(annual_revenue_billions)                             AS combined_revenue_b,
             AVG(gross_margin_pct)                                    AS avg_gross_margin,
             AVG(list_price_per_seat_usd)                             AS avg_seat_price,
             SUM(paying_seats_millions)                               AS total_paid_seats_millions,
             (SELECT COUNT(*) FROM challengers c
                JOIN incumbents i2 ON i2.id = c.incumbent_id
               WHERE i2.category = incumbents.category)               AS challenger_count,
             (SELECT COALESCE(SUM(c.arr_millions), 0) FROM challengers c
                JOIN incumbents i2 ON i2.id = c.incumbent_id
               WHERE i2.category = incumbents.category)               AS challenger_arr_m
        FROM incumbents
       GROUP BY category
       ORDER BY combined_revenue_b DESC NULLS LAST
    `);
    res.json(r.rows.map(row => ({
      ...row,
      combined_revenue_b: Number(row.combined_revenue_b || 0),
      avg_gross_margin: Number(row.avg_gross_margin || 0),
      avg_seat_price: Number(row.avg_seat_price || 0),
      total_paid_seats_millions: Number(row.total_paid_seats_millions || 0),
      challenger_arr_m: Number(row.challenger_arr_m || 0),
      attack_intensity_pct: row.combined_revenue_b > 0
        ? +(100 * Number(row.challenger_arr_m || 0) / (Number(row.combined_revenue_b) * 1000)).toFixed(3)
        : 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vulnerability ranking: incumbents with weakest margins, slowest growth,
// most challenger ARR aimed at them.
router.get('/vulnerability-ranking', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT i.id, i.name, i.category, i.annual_revenue_billions,
             i.gross_margin_pct, i.rule_of_40, i.code_lines_millions,
             COALESCE(c_agg.challenger_count, 0)                       AS challenger_count,
             COALESCE(c_agg.challenger_arr_m, 0)                       AS challenger_arr_m,
             COALESCE(c_agg.challenger_funding_m, 0)                   AS challenger_funding_m
        FROM incumbents i
        LEFT JOIN (
          SELECT incumbent_id,
                 COUNT(*) AS challenger_count,
                 COALESCE(SUM(arr_millions), 0) AS challenger_arr_m,
                 COALESCE(SUM(total_funding_millions), 0) AS challenger_funding_m
            FROM challengers
           GROUP BY incumbent_id
        ) c_agg ON c_agg.incumbent_id = i.id
       ORDER BY (
                 COALESCE(c_agg.challenger_arr_m, 0) /
                   NULLIF(i.annual_revenue_billions, 0)
               ) DESC NULLS LAST
       LIMIT 50
    `);
    res.json(r.rows.map(row => {
      const incRev = Number(row.annual_revenue_billions || 0) * 1000;
      const chARR = Number(row.challenger_arr_m || 0);
      const margin = Number(row.gross_margin_pct || 0);
      const r40 = Number(row.rule_of_40 || 0);
      const codeLines = Number(row.code_lines_millions || 0);
      // Heuristic vulnerability index 0-100
      const attackPct = incRev > 0 ? (100 * chARR) / incRev : 0;
      const marginRisk = Math.max(0, 80 - margin);
      const growthRisk = Math.max(0, 40 - r40);
      const codeMass = Math.min(40, codeLines);
      const score = Math.min(100, +(attackPct * 5 + marginRisk * 0.5 + growthRisk * 0.6 + codeMass * 0.4).toFixed(2));
      return {
        ...row,
        challenger_arr_m: chARR,
        challenger_funding_m: Number(row.challenger_funding_m || 0),
        attack_share_pct: +attackPct.toFixed(3),
        vulnerability_index: score
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM incumbents WHERE id = $1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'incumbent not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/challengers', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.*,
             (SELECT COUNT(*) FROM displacement_cases dc WHERE dc.challenger_id = c.id) AS case_count,
             (SELECT COALESCE(AVG(fte_per_million_arr), 0) FROM challengers WHERE incumbent_id = c.incumbent_id) AS peer_avg_fte_per_m
        FROM challengers c
       WHERE c.incumbent_id = $1
       ORDER BY c.arr_millions DESC NULLS LAST, c.name ASC
    `, [req.params.id]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name, category, flagship_product, annual_revenue_billions,
      paying_seats_millions, list_price_per_seat_usd, gross_margin_pct,
      code_lines_millions, rule_of_40, hq_country, founded_year, ticker, notes
    } = req.body || {};
    if (!name || !category) return res.status(400).json({ error: 'name and category are required' });
    const r = await pool.query(`
      INSERT INTO incumbents
        (name, category, flagship_product, annual_revenue_billions,
         paying_seats_millions, list_price_per_seat_usd, gross_margin_pct,
         code_lines_millions, rule_of_40, hq_country, founded_year, ticker, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      name, category, flagship_product || null, annual_revenue_billions || null,
      paying_seats_millions || null, list_price_per_seat_usd || null,
      gross_margin_pct || null, code_lines_millions || null, rule_of_40 || null,
      hq_country || null, founded_year || null, ticker || null, notes || null
    ]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'name already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = [
      'name','category','flagship_product','annual_revenue_billions',
      'paying_seats_millions','list_price_per_seat_usd','gross_margin_pct',
      'code_lines_millions','rule_of_40','hq_country','founded_year','ticker','notes'
    ];
    const sets = []; const vals = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { vals.push(req.body[f]); sets.push(`${f} = $${vals.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'no fields to update' });
    vals.push(req.params.id);
    const r = await pool.query(
      `UPDATE incumbents SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'incumbent not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM incumbents WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'incumbent not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
