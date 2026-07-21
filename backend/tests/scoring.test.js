const assert = require('node:assert/strict');
const test = require('node:test');
const { calculateAssessmentScore, SCORE_VERSION } = require('../services/scoring');

test('deterministic score calculates labor, savings, payback, and strong recommendation', () => {
  assert.deepEqual(calculateAssessmentScore({ annual_incumbent_cost_cents: 12_000_000, annual_challenger_cost_cents: 6_000_000, migration_cost_cents: 3_000_000, annual_hours_saved: 1000, loaded_hourly_cost_cents: 10_000, confidence_bps: 8000 }), {
    annual_labor_savings_cents: 10_000_000,
    gross_annual_savings_cents: 16_000_000,
    first_year_net_benefit_cents: 13_000_000,
    confidence_adjusted_benefit_cents: 10_400_000,
    payback_months_bps: 225,
    recommendation: 'STRONG_CANDIDATE',
    score_version: SCORE_VERSION,
  });
});

test('positive adjusted value without strong economics requires review', () => {
  const result = calculateAssessmentScore({ annual_incumbent_cost_cents: 10_000_000, annual_challenger_cost_cents: 9_500_000, migration_cost_cents: 100_000, annual_hours_saved: 0, loaded_hourly_cost_cents: 0, confidence_bps: 5000 });
  assert.equal(result.recommendation, 'REVIEW_REQUIRED');
});

test('negative benefit is held and has no payback when annual savings are non-positive', () => {
  const result = calculateAssessmentScore({ annual_incumbent_cost_cents: 1_000, annual_challenger_cost_cents: 2_000, migration_cost_cents: 500, annual_hours_saved: 0, loaded_hourly_cost_cents: 0, confidence_bps: 9000 });
  assert.equal(result.recommendation, 'HOLD');
  assert.equal(result.payback_months_bps, null);
  assert.equal(result.confidence_adjusted_benefit_cents, -1350);
});

test('half-up confidence rounding is deterministic for positive and negative values', () => {
  assert.equal(calculateAssessmentScore({ annual_incumbent_cost_cents: 101, annual_challenger_cost_cents: 0, migration_cost_cents: 0, annual_hours_saved: 0, loaded_hourly_cost_cents: 0, confidence_bps: 5000 }).confidence_adjusted_benefit_cents, 51);
  assert.equal(calculateAssessmentScore({ annual_incumbent_cost_cents: 0, annual_challenger_cost_cents: 101, migration_cost_cents: 0, annual_hours_saved: 0, loaded_hourly_cost_cents: 0, confidence_bps: 5000 }).confidence_adjusted_benefit_cents, -51);
});

test('unsafe score range fails closed', () => {
  assert.throws(() => calculateAssessmentScore({ annual_incumbent_cost_cents: Number.MAX_SAFE_INTEGER, annual_challenger_cost_cents: 0, migration_cost_cents: 0, annual_hours_saved: 10_000_000, loaded_hourly_cost_cents: 100_000_000, confidence_bps: 10000 }), /safe integer/);
});
