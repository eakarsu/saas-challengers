const router = require('express').Router();
const pool = require('../db');
const { AppError } = require('../lib/errors');

function setting(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new AppError('AI service is not configured', 503, 'AI_NOT_CONFIGURED');
  return value;
}

router.post('/', async (req, res, next) => {
  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt || prompt.length > 4000) throw new AppError('prompt must contain 1 to 4000 characters', 400, 'PROMPT_INVALID');
    const apiKey = setting('OPENROUTER_API_KEY');
    const model = setting('OPENROUTER_MODEL');
    const baseUrl = setting('OPENROUTER_BASE_URL').replace(/\/$/, '');
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': `http://127.0.0.1:${process.env.FRONTEND_PORT}`,
        'X-Title': 'SaaS Challengers Runtime Verification',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Give one concise, evidence-minded SaaS research recommendation.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 160,
      }),
    });
    if (!upstream.ok) throw new AppError('AI provider is unavailable', 502, 'AI_PROVIDER_ERROR');
    const payload = await upstream.json();
    const content = payload.choices?.[0]?.message?.content?.trim();
    const providerRequestId = typeof payload.id === 'string' ? payload.id.trim() : '';
    const resolvedModel = typeof payload.model === 'string' && payload.model.trim() ? payload.model.trim() : model;
    if (!content || !providerRequestId) throw new AppError('AI provider returned an incomplete response', 502, 'AI_PROVIDER_INCOMPLETE');
    const { rows } = await pool.query(
      `INSERT INTO ai_provider_receipts
         (organization_id,user_id,prompt,content,provider,provider_request_id,model)
       VALUES($1,$2,$3,$4,'openrouter',$5,$6)
       RETURNING id,provider,provider_request_id,model,created_at`,
      [req.actor.organization_id, req.actor.id, prompt, content, providerRequestId, resolvedModel],
    );
    res.json({ content, model: resolvedModel, receipt: rows[0], providerReceipt: rows[0] });
  } catch (error) { next(error); }
});

module.exports = router;
