// SaaS Challengers: Switching Cost Estimator
// Real cost-line items between an incumbent and a challenger:
// data migration, training, integration, contract penalties, and risk.
//
// Routes:
//   GET    /api/switching                       list (filter by incumbent / challenger)
//   GET    /api/switching/:id
//   POST   /api/switching
//   PUT    /api/switching/:id
//   DELETE /api/switching/:id
//   GET    /api/switching/pair/:incumbent_id/:challenger_id     summary for a pair
//   GET    /api/switching/by-category                            roll-up

const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { incumbent_id, challenger_id, cost_category, blocker } = req.query;
    const wh = []; const p = [];
    if (incumbent_id)   { p.push(incumbent_id);   wh.push(`sc.incumbent_id = $${p.length}`); }
    if (challenger_id)  { p.push(challenger_id);  wh.push(`sc.challenger_id = $${p.length}`); }
    if (cost_category)  { p.push(cost_category);  wh.push(`sc.cost_category = $${p.length}`); }
    if (blocker !== undefined) {
      p.push(String(blocker) === 'true');
      wh.push(`sc.blocker = $${p.length}`);
    }
    const r = await pool.query(`
      SELECT sc.*,
             i.name AS incumbent_name,
             c.name AS challenger_name
        FROM switching_costs sc
        LEFT JOIN incumbents i ON i.id = sc.incumbent_id
        LEFT JOIN challengers c ON c.id = sc.challenger_id
        ${wh.length ? 'WHERE ' + wh.join(' AND ') : ''}
       ORDER BY sc.risk_level DESC, sc.one_time_cost_usd DESC NULLS LAST
    `, p);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/by-category', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT cost_category,
             COUNT(*) AS items,
             AVG(one_time_cost_usd) AS avg_cost,
             SUM(one_time_cost_usd) AS total_cost,
             AVG(duration_weeks) AS avg_duration_weeks,
             SUM(CASE WHEN blocker THEN 1 ELSE 0 END) AS blocker_count,
             SUM(CASE WHEN risk_level IN ('high','critical') THEN 1 ELSE 0 END) AS high_risk_count
        FROM switching_costs
       GROUP BY cost_category
       ORDER BY total_cost DESC NULLS LAST
    `);
    res.json(r.rows.map(row => ({
      ...row,
      avg_cost: row.avg_cost === null ? null : +Number(row.avg_cost).toFixed(2),
      total_cost: row.total_cost === null ? null : +Number(row.total_cost).toFixed(2),
      avg_duration_weeks: row.avg_duration_weeks === null ? null : +Number(row.avg_duration_weeks).toFixed(2)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pair/:incumbent_id/:challenger_id', async (req, res) => {
  try {
    const { incumbent_id, challenger_id } = req.params;
    const rows = await pool.query(`
      SELECT * FROM switching_costs
       WHERE incumbent_id = $1 AND challenger_id = $2
       ORDER BY one_time_cost_usd DESC NULLS LAST
    `, [incumbent_id, challenger_id]);

    const meta = await pool.query(`
      SELECT i.name AS incumbent_name, i.list_price_per_seat_usd, i.category AS incumbent_category,
             c.name AS challenger_name, c.pricing_model, c.arr_millions,
             c.fte_per_million_arr
        FROM incumbents i, challengers c
       WHERE i.id = $1 AND c.id = $2
    `, [incumbent_id, challenger_id]);

    const items = rows.rows;
    const totalCost = items.reduce((s, x) => s + Number(x.one_time_cost_usd || 0), 0);
    const totalWeeks = items.reduce((s, x) => Math.max(s, Number(x.duration_weeks || 0)), 0);
    const blockers = items.filter(x => x.blocker);
    const byRisk = { low: 0, medium: 0, high: 0, critical: 0 };
    items.forEach(x => {
      const lvl = x.risk_level || 'low';
      byRisk[lvl] = (byRisk[lvl] || 0) + Number(x.one_time_cost_usd || 0);
    });

    // Switch-readiness score: lower = harder to switch
    let readiness = 100;
    readiness -= Math.min(40, Math.log10(Math.max(totalCost, 1)) * 5);
    readiness -= Math.min(20, totalWeeks * 0.5);
    readiness -= blockers.length * 12;
    readiness = Math.max(0, +readiness.toFixed(1));

    res.json({
      pair: meta.rows[0] || null,
      items,
      summary: {
        item_count: items.length,
        total_one_time_cost_usd: totalCost,
        critical_path_weeks: totalWeeks,
        blocker_count: blockers.length,
        cost_by_risk: byRisk,
        readiness_score: readiness,
        verdict: readiness >= 75
          ? 'easy switch — low cost, low risk'
          : readiness >= 50
            ? 'feasible with planning — typical 1-3 quarter migration'
            : readiness >= 25
              ? 'hard — multi-quarter, exec sponsor required'
              : 'effectively locked-in — switching cost dwarfs annual contract'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT sc.*, i.name AS incumbent_name, c.name AS challenger_name
        FROM switching_costs sc
        LEFT JOIN incumbents i ON i.id = sc.incumbent_id
        LEFT JOIN challengers c ON c.id = sc.challenger_id
       WHERE sc.id = $1
    `, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'switching cost not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const f = [
      'incumbent_id','challenger_id','cost_category','description',
      'one_time_cost_usd','duration_weeks','risk_level','blocker'
    ];
    if (!req.body?.incumbent_id || !req.body?.challenger_id || !req.body?.cost_category) {
      return res.status(400).json({ error: 'incumbent_id, challenger_id, cost_category required' });
    }
    const vals = f.map(k => req.body[k] === undefined ? null : req.body[k]);
    const placeholders = f.map((_, i) => `$${i + 1}`).join(',');
    const r = await pool.query(
      `INSERT INTO switching_costs (${f.join(',')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const fields = [
      'cost_category','description','one_time_cost_usd','duration_weeks',
      'risk_level','blocker'
    ];
    const sets = []; const vals = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { vals.push(req.body[f]); sets.push(`${f} = $${vals.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'no fields to update' });
    vals.push(req.params.id);
    const r = await pool.query(
      `UPDATE switching_costs SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM switching_costs WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
