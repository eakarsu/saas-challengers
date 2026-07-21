const { AppError } = require('../lib/errors');

const SCORE_VERSION = 'cost-v1';

function roundRatio(numerator, denominator) {
  if (denominator <= 0n) throw new AppError('Score denominator must be positive', 422, 'SCORE_RANGE');
  const negative = numerator < 0n;
  const absolute = negative ? -numerator : numerator;
  const rounded = (absolute + denominator / 2n) / denominator;
  return negative ? -rounded : rounded;
}

function safeNumber(value, name) {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new AppError(`${name} exceeds safe integer limits`, 422, 'SCORE_RANGE');
  return result;
}

function calculateAssessmentScore(input) {
  const incumbent = BigInt(input.annual_incumbent_cost_cents);
  const challenger = BigInt(input.annual_challenger_cost_cents);
  const migration = BigInt(input.migration_cost_cents);
  const labor = BigInt(input.annual_hours_saved) * BigInt(input.loaded_hourly_cost_cents);
  const gross = incumbent - challenger + labor;
  const firstYear = gross - migration;
  const adjusted = roundRatio(firstYear * BigInt(input.confidence_bps), 10000n);
  const payback = gross > 0n ? roundRatio(migration * 1200n, gross) : null;
  const recommendation = firstYear > 0n && gross * 10000n >= incumbent * 2000n && payback !== null && payback <= 1200n
    ? 'STRONG_CANDIDATE'
    : adjusted > 0n ? 'REVIEW_REQUIRED' : 'HOLD';
  return {
    annual_labor_savings_cents: safeNumber(labor, 'annual labor savings'),
    gross_annual_savings_cents: safeNumber(gross, 'gross annual savings'),
    first_year_net_benefit_cents: safeNumber(firstYear, 'first-year benefit'),
    confidence_adjusted_benefit_cents: safeNumber(adjusted, 'confidence-adjusted benefit'),
    payback_months_bps: payback === null ? null : safeNumber(payback, 'payback'),
    recommendation,
    score_version: SCORE_VERSION,
  };
}

module.exports = { calculateAssessmentScore, SCORE_VERSION };
