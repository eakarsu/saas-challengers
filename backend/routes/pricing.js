// SaaS Challengers: Pricing Model Comparator
// Compares per_seat / per_action / outcome / hybrid / freemium models with
// unit economics, gross-margin assumptions, and a scenario simulator.
//
// Routes:
//   GET    /api/pricing                          list pricing model definitions
//   GET    /api/pricing/:name
//   POST   /api/pricing
//   PUT    /api/pricing/:name
//   DELETE /api/pricing/:name
//   POST   /api/pricing/simulate                 scenario simulator
//   GET    /api/pricing/distribution             distribution of pricing models across challengers
//   GET    /api/pricing/compare?incumbent_id=&challenger_id=

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT pm.*,
             (SELECT COUNT(*) FROM challengers c WHERE c.pricing_model = pm.name) AS challenger_count,
             (SELECT COALESCE(SUM(c.arr_millions), 0) FROM challengers c WHERE c.pricing_model = pm.name) AS arr_m
        FROM pricing_models pm
       ORDER BY pm.typical_acv_usd DESC NULLS LAST
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/distribution', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT pm.name AS pricing_model,
             pm.gross_margin_pct AS model_gm,
             pm.typical_acv_usd AS model_acv,
             pm.scaling_curve,
             COUNT(c.id) AS challenger_count,
             COALESCE(SUM(c.arr_millions), 0) AS arr_m,
             COALESCE(SUM(c.total_funding_millions), 0) AS funding_m,
             COALESCE(AVG(c.fte_per_million_arr), 0) AS avg_fte_per_m
        FROM pricing_models pm
        LEFT JOIN challengers c ON c.pricing_model = pm.name
       GROUP BY pm.id, pm.name, pm.gross_margin_pct, pm.typical_acv_usd, pm.scaling_curve
       ORDER BY arr_m DESC
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/compare', async (req, res) => {
  try {
    const { incumbent_id, challenger_id } = req.query;
    if (!incumbent_id || !challenger_id) {
      return res.status(400).json({ error: 'incumbent_id and challenger_id required' });
    }
    const inc = await pool.query('SELECT * FROM incumbents WHERE id = $1', [incumbent_id]);
    const ch = await pool.query('SELECT * FROM challengers WHERE id = $1', [challenger_id]);
    if (!inc.rows[0] || !ch.rows[0]) return res.status(404).json({ error: 'pair not found' });
    const pm = await pool.query('SELECT * FROM pricing_models WHERE name = $1', [ch.rows[0].pricing_model]);

    const incPrice = Number(inc.rows[0].list_price_per_seat_usd || 0);
    const incGM = Number(inc.rows[0].gross_margin_pct || 0);
    const chPrice = Number(pm.rows[0]?.typical_acv_usd || incPrice);
    const chGM = Number(pm.rows[0]?.gross_margin_pct || 0);

    res.json({
      incumbent: {
        name: inc.rows[0].name,
        pricing_model: 'per_seat',
        price_usd: incPrice,
        gross_margin_pct: incGM
      },
      challenger: {
        name: ch.rows[0].name,
        pricing_model: ch.rows[0].pricing_model,
        typical_acv_usd: chPrice,
        gross_margin_pct: chGM
      },
      price_delta_pct: incPrice > 0 ? +(100 * (chPrice - incPrice) / incPrice).toFixed(1) : null,
      margin_delta_pp: +(chGM - incGM).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simulate revenue, COGS, gross profit across the model spectrum for a given
// workload (seats, actions, savings_pool, deflection_rate).
router.post('/simulate', async (req, res) => {
  try {
    const {
      seats = 0, actions_per_year = 0, savings_pool_usd = 0,
      per_seat_price_usd = 1800, per_action_price_usd = 4,
      outcome_share_pct = 25, cogs_per_action_usd = 1.4,
      cogs_per_seat_usd = 360, deflection_rate_pct = 70
    } = req.body || {};

    const seatRev = Number(seats) * Number(per_seat_price_usd);
    const seatCogs = Number(seats) * Number(cogs_per_seat_usd);

    const successfulActions = Number(actions_per_year) * (Number(deflection_rate_pct) / 100);
    const perActionRev = successfulActions * Number(per_action_price_usd);
    const perActionCogs = Number(actions_per_year) * Number(cogs_per_action_usd); // pay COGS on all attempts

    const outcomeRev = Number(savings_pool_usd) * (Number(outcome_share_pct) / 100);
    const outcomeCogs = Number(actions_per_year) * Number(cogs_per_action_usd) * 0.8;

    function pack(name, rev, cogs) {
      const gross = rev - cogs;
      return {
        model: name,
        revenue_usd: +rev.toFixed(2),
        cogs_usd: +cogs.toFixed(2),
        gross_profit_usd: +gross.toFixed(2),
        gross_margin_pct: rev > 0 ? +(100 * gross / rev).toFixed(2) : null
      };
    }

    const scenarios = [
      pack('per_seat', seatRev, seatCogs),
      pack('per_action', perActionRev, perActionCogs),
      pack('outcome', outcomeRev, outcomeCogs),
      pack('hybrid', seatRev * 0.4 + perActionRev * 0.6, seatCogs * 0.4 + perActionCogs * 0.6)
    ];

    const ranked = [...scenarios].sort((a, b) => (b.gross_profit_usd || 0) - (a.gross_profit_usd || 0));
    res.json({
      inputs: {
        seats, actions_per_year, savings_pool_usd, per_seat_price_usd,
        per_action_price_usd, outcome_share_pct, cogs_per_action_usd,
        cogs_per_seat_usd, deflection_rate_pct
      },
      scenarios,
      best_model: ranked[0],
      worst_model: ranked[ranked.length - 1],
      notes: ranked[0].gross_profit_usd <= 0
        ? 'All models negative-gross-profit; revisit unit economics.'
        : `Best model ${ranked[0].model} produces $${ranked[0].gross_profit_usd.toLocaleString()} gross profit at ${ranked[0].gross_margin_pct}% margin.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:name', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM pricing_models WHERE name = $1', [req.params.name]);
    if (!r.rows[0]) return res.status(404).json({ error: 'pricing model not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name, description, typical_acv_usd, gross_margin_pct,
      scaling_curve, buyer_persona, notes
    } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await pool.query(`
      INSERT INTO pricing_models
        (name, description, typical_acv_usd, gross_margin_pct,
         scaling_curve, buyer_persona, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [
      name, description || null, typical_acv_usd || null, gross_margin_pct || null,
      scaling_curve || null, buyer_persona || null, notes || null
    ]);
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'name already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:name', async (req, res) => {
  try {
    const fields = [
      'description','typical_acv_usd','gross_margin_pct',
      'scaling_curve','buyer_persona','notes'
    ];
    const sets = []; const vals = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { vals.push(req.body[f]); sets.push(`${f} = $${vals.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'no fields to update' });
    vals.push(req.params.name);
    const r = await pool.query(
      `UPDATE pricing_models SET ${sets.join(', ')} WHERE name = $${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:name', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM pricing_models WHERE name = $1 RETURNING name', [req.params.name]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
