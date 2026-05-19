// SaaS Challengers: Custom Views (Challenger Views)
// 4 endpoints powering 2 VIZ + 2 NON-VIZ features:
//   GET  /api/custom-views/market-position           -> VIZ: market position chart
//   GET  /api/custom-views/feature-heatmap           -> VIZ: feature comparison heatmap
//   POST /api/custom-views/competitive-pdf           -> NON-VIZ: competitive analysis PDF
//   GET    /api/custom-views/tracking-rules          -> NON-VIZ: tracking rules editor (LIST)
//   POST   /api/custom-views/tracking-rules          -> NON-VIZ: tracking rules editor (CREATE)
//   PUT    /api/custom-views/tracking-rules/:id      -> NON-VIZ: tracking rules editor (UPDATE)
//   DELETE /api/custom-views/tracking-rules/:id      -> NON-VIZ: tracking rules editor (DELETE)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

async function ensureRulesTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS challenger_tracking_rules (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      metric TEXT NOT NULL,
      operator TEXT NOT NULL,
      threshold NUMERIC,
      severity TEXT DEFAULT 'medium',
      enabled BOOLEAN DEFAULT TRUE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    const r = await pool.query(`SELECT COUNT(*)::INT AS c FROM challenger_tracking_rules`);
    if (r.rows[0].c === 0) {
      await pool.query(`
        INSERT INTO challenger_tracking_rules (name, metric, operator, threshold, severity, notes) VALUES
        ('ARR ramp alert',           'arr_millions',          '>',  100, 'high',   'Challenger crossed $100M ARR'),
        ('Capital efficiency watch', 'capital_efficiency',    '>',  50,  'medium', 'Strong $1 ARR per $2 funding'),
        ('Vulnerability spike',      'vulnerability_index',   '>=', 70,  'high',   'Incumbent vulnerability >= 70'),
        ('Pricing collapse',         'list_price_per_seat_usd','<', 50,  'low',    'Seat price dropped below $50')
      `);
    }
  } catch (e) { /* swallow */ }
}

// ---------------------------------------------------------------------------
// VIZ 1: Market position chart
// Returns {x: funding_m, y: arr_m, r: customer_count, label, stage, category}
// ---------------------------------------------------------------------------
router.get('/market-position', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.id, c.name, c.category, c.stage,
             COALESCE(c.arr_millions, 0)            AS arr_m,
             COALESCE(c.total_funding_millions, 0)  AS funding_m,
             COALESCE(c.last_valuation_billions, 0) AS valuation_b,
             COALESCE(c.customer_count, 0)          AS customers,
             COALESCE(c.fte_per_million_arr, 0)     AS fte_per_m,
             i.name AS incumbent_name
        FROM challengers c
        LEFT JOIN incumbents i ON i.id = c.incumbent_id
    `);
    const points = r.rows.map(row => {
      const arr = Number(row.arr_m);
      const fund = Number(row.funding_m);
      return {
        id: row.id,
        label: row.name,
        category: row.category,
        stage: row.stage,
        incumbent: row.incumbent_name,
        x: fund,
        y: arr,
        valuation_b: Number(row.valuation_b),
        customers: Number(row.customers),
        capital_efficiency: fund > 0 ? +((arr / fund) * 100).toFixed(2) : null,
      };
    });
    const maxX = Math.max(1, ...points.map(p => p.x));
    const maxY = Math.max(1, ...points.map(p => p.y));
    res.json({
      points,
      bounds: { max_funding_m: maxX, max_arr_m: maxY },
      count: points.length,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// VIZ 2: Feature comparison heatmap
// Builds a synthetic 0..100 score per (challenger, dimension) using DB signals.
// Dimensions: ai_native, pricing_power, capital_efficiency, customer_traction,
//             moat_strength, displacement_proof
// ---------------------------------------------------------------------------
router.get('/feature-heatmap', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10) || 12, 1), 40);
    const r = await pool.query(`
      SELECT c.id, c.name, c.category, c.stage,
             COALESCE(c.arr_millions, 0)            AS arr_m,
             COALESCE(c.total_funding_millions, 0)  AS funding_m,
             COALESCE(c.fte_per_million_arr, 0)     AS fte_per_m,
             COALESCE(c.customer_count, 0)          AS customers,
             COALESCE(c.last_valuation_billions, 0) AS valuation_b,
             (SELECT composite_score FROM moats m WHERE m.challenger_id = c.id ORDER BY id DESC LIMIT 1) AS moat_score,
             (SELECT COUNT(*) FROM displacement_cases dc WHERE dc.challenger_id = c.id) AS case_count
        FROM challengers c
        ORDER BY c.arr_millions DESC NULLS LAST
        LIMIT $1
    `, [limit]);

    const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
    const dimensions = ['ai_native', 'pricing_power', 'capital_efficiency', 'customer_traction', 'moat_strength', 'displacement_proof'];

    const rows = r.rows.map(row => {
      const arr = Number(row.arr_m);
      const fund = Number(row.funding_m);
      const fte = Number(row.fte_per_m);
      const cust = Number(row.customers);
      const val = Number(row.valuation_b);
      const moat = row.moat_score === null ? null : Number(row.moat_score);
      const cases = Number(row.case_count);

      const ai_native = clamp(fte > 0 ? Math.max(0, 100 - fte * 10) : 60);
      const pricing_power = clamp(val > 0 && arr > 0 ? Math.min(100, (val * 1000 / arr) * 1.5) : 30);
      const capital_efficiency = clamp(fund > 0 ? Math.min(100, (arr / fund) * 100) : 0);
      const customer_traction = clamp(cust > 0 ? Math.min(100, Math.log10(cust + 1) * 25) : 0);
      const moat_strength = clamp(moat !== null ? moat * 10 : 40);
      const displacement_proof = clamp(Math.min(100, cases * 25 + (arr > 50 ? 20 : 0)));

      return {
        id: row.id,
        label: row.name,
        category: row.category,
        scores: { ai_native, pricing_power, capital_efficiency, customer_traction, moat_strength, displacement_proof },
      };
    });

    res.json({ dimensions, rows, count: rows.length, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NON-VIZ 1: Competitive analysis PDF
// Returns a hand-written minimal PDF (no external deps) summarising the
// requested incumbent vs its top N challengers. application/pdf.
// ---------------------------------------------------------------------------
function escPdf(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function buildPdf(lines) {
  const header = '%PDF-1.4\n';
  const objs = [];
  const push = (s) => { objs.push(s); return objs.length; };

  push('<< /Type /Catalog /Pages 2 0 R >>');
  push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');

  let stream = 'BT /F1 14 Tf 50 760 Td 16 TL\n';
  lines.forEach((ln, i) => {
    const safe = escPdf(ln).slice(0, 110);
    if (i === 0) stream += `(${safe}) Tj T*\n`;
    else stream += `(${safe}) ' \n`;
  });
  stream += 'ET';
  push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let body = '';
  const offsets = [0];
  let cursor = header.length;
  objs.forEach((o, idx) => {
    const chunk = `${idx + 1} 0 obj\n${o}\nendobj\n`;
    offsets.push(cursor);
    body += chunk;
    cursor += Buffer.byteLength(chunk);
  });
  const xrefStart = cursor;
  let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(header + body + xref + trailer, 'binary');
}

router.post('/competitive-pdf', async (req, res) => {
  try {
    const incumbentId = req.body?.incumbent_id ? Number(req.body.incumbent_id) : null;
    const topN = Math.min(Math.max(parseInt(req.body?.top_n || '5', 10) || 5, 1), 20);

    let incumbent = null;
    if (incumbentId) {
      const ir = await pool.query(`SELECT id, name, category, annual_revenue_billions, gross_margin_pct, rule_of_40 FROM incumbents WHERE id = $1`, [incumbentId]);
      incumbent = ir.rows[0] || null;
    }
    const cr = incumbentId
      ? await pool.query(`SELECT name, stage, arr_millions, total_funding_millions, last_valuation_billions, customer_count FROM challengers WHERE incumbent_id = $1 ORDER BY arr_millions DESC NULLS LAST LIMIT $2`, [incumbentId, topN])
      : await pool.query(`SELECT name, stage, arr_millions, total_funding_millions, last_valuation_billions, customer_count FROM challengers ORDER BY arr_millions DESC NULLS LAST LIMIT $1`, [topN]);

    const lines = [];
    lines.push('SaaS Challengers - Competitive Analysis');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    if (incumbent) {
      lines.push(`Incumbent: ${incumbent.name} (${incumbent.category})`);
      lines.push(`Revenue: $${Number(incumbent.annual_revenue_billions || 0).toFixed(2)}B  GM: ${incumbent.gross_margin_pct || '-'}%  R40: ${incumbent.rule_of_40 || '-'}`);
      lines.push('');
    } else {
      lines.push('Scope: top challengers across all incumbents');
      lines.push('');
    }
    lines.push(`Top ${cr.rows.length} Challengers by ARR:`);
    cr.rows.forEach((c, i) => {
      const arr = Number(c.arr_millions || 0).toFixed(1);
      const fund = Number(c.total_funding_millions || 0).toFixed(1);
      const val = Number(c.last_valuation_billions || 0).toFixed(2);
      lines.push(`${i + 1}. ${c.name} | ${c.stage || '-'} | ARR $${arr}M | Funding $${fund}M | Val $${val}B`);
    });
    lines.push('');
    lines.push('Note: Generated server-side, no external PDF dependency.');

    const pdf = buildPdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="competitive-analysis.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NON-VIZ 2: Tracking rules editor (CRUD)
// ---------------------------------------------------------------------------
router.get('/tracking-rules', async (_req, res) => {
  try {
    await ensureRulesTable();
    const r = await pool.query(`SELECT * FROM challenger_tracking_rules ORDER BY id ASC`);
    res.json({ rules: r.rows, count: r.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tracking-rules', async (req, res) => {
  try {
    await ensureRulesTable();
    const { name, metric, operator, threshold, severity, enabled, notes } = req.body || {};
    if (!name || !metric || !operator) return res.status(400).json({ error: 'name, metric, operator required' });
    const r = await pool.query(
      `INSERT INTO challenger_tracking_rules (name, metric, operator, threshold, severity, enabled, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, metric, operator, threshold ?? null, severity || 'medium', enabled !== false, notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tracking-rules/:id', async (req, res) => {
  try {
    await ensureRulesTable();
    const fields = ['name', 'metric', 'operator', 'threshold', 'severity', 'enabled', 'notes'];
    const sets = []; const vals = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { vals.push(req.body[f]); sets.push(`${f} = $${vals.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'no fields to update' });
    sets.push(`updated_at = NOW()`);
    vals.push(req.params.id);
    const r = await pool.query(`UPDATE challenger_tracking_rules SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`, vals);
    if (!r.rows[0]) return res.status(404).json({ error: 'rule not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tracking-rules/:id', async (req, res) => {
  try {
    await ensureRulesTable();
    const r = await pool.query(`DELETE FROM challenger_tracking_rules WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'rule not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
