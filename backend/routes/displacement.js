// SaaS Challengers: Seat-Replacement Calculator + Case Library
// Records of FTE displacement: pre / post headcount, ACV, loaded FTE cost,
// payback months.  Also exposes a calculator that converts hypothetical inputs
// into the same shape.
//
// Routes:
//   GET    /api/displacement
//   POST   /api/displacement
//   PUT    /api/displacement/:id
//   DELETE /api/displacement/:id
//   POST   /api/displacement/calculate         (hypothetical scenario)
//   GET    /api/displacement/by-industry
//   GET    /api/displacement/fte-per-million

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { challenger_id, industry } = req.query;
    const wh = []; const p = [];
    if (challenger_id) { p.push(challenger_id); wh.push(`dc.challenger_id = $${p.length}`); }
    if (industry)      { p.push(industry);      wh.push(`dc.industry = $${p.length}`); }
    const r = await pool.query(`
      SELECT dc.*,
             c.name AS challenger_name,
             c.category AS challenger_category,
             c.pricing_model,
             i.name AS incumbent_name
        FROM displacement_cases dc
        LEFT JOIN challengers c ON c.id = dc.challenger_id
        LEFT JOIN incumbents i ON i.id = c.incumbent_id
        ${wh.length ? 'WHERE ' + wh.join(' AND ') : ''}
       ORDER BY dc.reported_at DESC NULLS LAST, dc.id DESC
    `, p);
    res.json(r.rows.map(row => {
      const pre = Number(row.pre_headcount || 0);
      const post = Number(row.post_headcount || 0);
      const acv = Number(row.contract_acv_usd || 0);
      const loaded = Number(row.loaded_fte_cost_usd || 0);
      const displaced = Math.max(0, pre - post);
      const annualSavings = displaced * loaded;
      const netSavings = annualSavings - acv;
      const savingsRatio = annualSavings > 0 ? +(netSavings / annualSavings).toFixed(3) : null;
      const fteReductionPct = pre > 0 ? +(100 * displaced / pre).toFixed(2) : null;
      return {
        ...row,
        displaced_fte: displaced,
        annual_loaded_savings_usd: annualSavings,
        net_savings_usd: netSavings,
        savings_ratio: savingsRatio,
        fte_reduction_pct: fteReductionPct
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/by-industry', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT COALESCE(industry, 'unknown') AS industry,
             COUNT(*) AS cases,
             SUM(GREATEST(pre_headcount - post_headcount, 0)) AS total_displaced_fte,
             AVG(GREATEST(pre_headcount - post_headcount, 0)::numeric / NULLIF(pre_headcount, 0)) AS avg_reduction_pct,
             SUM(contract_acv_usd) AS total_acv_usd,
             AVG(payback_months) AS avg_payback_months
        FROM displacement_cases
       GROUP BY industry
       ORDER BY total_displaced_fte DESC NULLS LAST
    `);
    res.json(r.rows.map(row => ({
      ...row,
      avg_reduction_pct: row.avg_reduction_pct === null
        ? null
        : +(Number(row.avg_reduction_pct) * 100).toFixed(2),
      avg_payback_months: row.avg_payback_months === null
        ? null
        : +Number(row.avg_payback_months).toFixed(2)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/fte-per-million', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.id AS challenger_id, c.name, c.fte_per_million_arr, c.arr_millions,
             COALESCE(SUM(GREATEST(dc.pre_headcount - dc.post_headcount, 0)), 0) AS realized_displacement,
             COUNT(dc.id) AS case_count
        FROM challengers c
        LEFT JOIN displacement_cases dc ON dc.challenger_id = c.id
       GROUP BY c.id
       ORDER BY c.fte_per_million_arr DESC NULLS LAST
    `);
    res.json(r.rows.map(row => {
      const arr = Number(row.arr_millions || 0);
      const declared = Number(row.fte_per_million_arr || 0);
      const realised = Number(row.realized_displacement || 0);
      const realisedRate = arr > 0 ? +(realised / arr).toFixed(2) : null;
      return {
        ...row,
        declared_fte_per_million: declared,
        realised_fte_per_million: realisedRate,
        delta: realisedRate === null ? null : +(realisedRate - declared).toFixed(2)
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hypothetical scenario calculator — does NOT write to DB unless `save=true`.
router.post('/calculate', async (req, res) => {
  try {
    const {
      challenger_id, customer_name = 'Hypothetical', industry = null,
      pre_headcount, post_headcount, contract_acv_usd,
      loaded_fte_cost_usd = 165000, ramp_months = 6, save = false
    } = req.body || {};
    if (pre_headcount === undefined || post_headcount === undefined || contract_acv_usd === undefined) {
      return res.status(400).json({ error: 'pre_headcount, post_headcount, contract_acv_usd required' });
    }
    const pre = Number(pre_headcount);
    const post = Number(post_headcount);
    const acv = Number(contract_acv_usd);
    const loaded = Number(loaded_fte_cost_usd);
    const ramp = Number(ramp_months);
    if (post > pre) return res.status(400).json({ error: 'post_headcount cannot exceed pre_headcount' });
    if (acv < 0 || loaded < 0) return res.status(400).json({ error: 'monetary fields must be >= 0' });

    const displaced = pre - post;
    const annualSavings = displaced * loaded;
    const netSavings = annualSavings - acv;
    const monthlyNet = netSavings / 12;
    let payback = null;
    if (monthlyNet > 0) {
      const upfront = acv * 0.5 + (ramp / 12) * acv;
      payback = +(upfront / monthlyNet).toFixed(2);
    }
    const result = {
      challenger_id: challenger_id || null,
      customer_name,
      industry,
      pre_headcount: pre,
      post_headcount: post,
      displaced_fte: displaced,
      fte_reduction_pct: pre > 0 ? +(100 * displaced / pre).toFixed(2) : null,
      contract_acv_usd: acv,
      loaded_fte_cost_usd: loaded,
      annual_loaded_savings_usd: annualSavings,
      net_savings_usd: netSavings,
      payback_months: payback,
      ramp_months: ramp,
      verdict: netSavings <= 0
        ? 'negative — challenger ACV exceeds displacement savings'
        : payback === null
          ? 'break-even but no payback'
          : payback <= 12
            ? 'strong — < 1 year payback'
            : payback <= 24
              ? 'acceptable — 1-2 year payback'
              : 'weak — > 2 year payback'
    };

    if (save && challenger_id) {
      const ins = await pool.query(`
        INSERT INTO displacement_cases
          (challenger_id, customer_name, industry, pre_headcount, post_headcount,
           contract_acv_usd, loaded_fte_cost_usd, payback_months, reported_at, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE,$9)
        RETURNING id
      `, [
        challenger_id, customer_name, industry, pre, post, acv, loaded,
        payback, 'Saved from /displacement/calculate'
      ]);
      result.saved_id = ins.rows[0].id;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const f = [
      'challenger_id','customer_name','industry','pre_headcount','post_headcount',
      'contract_acv_usd','loaded_fte_cost_usd','payback_months','evidence_url',
      'reported_at','notes'
    ];
    if (!req.body?.challenger_id || !req.body?.customer_name) {
      return res.status(400).json({ error: 'challenger_id and customer_name required' });
    }
    const vals = f.map(k => req.body[k] === undefined ? null : req.body[k]);
    const placeholders = f.map((_, i) => `$${i + 1}`).join(',');
    const r = await pool.query(
      `INSERT INTO displacement_cases (${f.join(',')}) VALUES (${placeholders}) RETURNING *`,
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
      'customer_name','industry','pre_headcount','post_headcount',
      'contract_acv_usd','loaded_fte_cost_usd','payback_months','evidence_url',
      'reported_at','notes'
    ];
    const sets = []; const vals = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { vals.push(req.body[f]); sets.push(`${f} = $${vals.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'no fields to update' });
    vals.push(req.params.id);
    const r = await pool.query(
      `UPDATE displacement_cases SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'case not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM displacement_cases WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'case not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
