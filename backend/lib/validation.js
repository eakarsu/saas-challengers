const { AppError } = require('./errors');

function objectBody(req) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new AppError('A JSON object body is required', 400, 'BODY_INVALID');
  return req.body;
}

function text(value, name, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string') throw new AppError(`${name} is required`, 422, 'VALIDATION_ERROR');
  const result = value.trim();
  if (result.length < min || result.length > max) throw new AppError(`${name} must be ${min}-${max} characters`, 422, 'VALIDATION_ERROR');
  return result;
}

function email(value) {
  const result = text(value, 'email', { min: 3, max: 255 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new AppError('Email is invalid', 422, 'VALIDATION_ERROR');
  return result;
}

function password(value) {
  const result = text(value, 'password', { min: 12, max: 72 });
  if (!/[a-z]/.test(result) || !/[A-Z]/.test(result) || !/[0-9]/.test(result)) throw new AppError('Password must include upper-case, lower-case, and numeric characters', 422, 'PASSWORD_POLICY');
  return result;
}

function integer(value, name, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new AppError(`${name} must be an integer from ${min} to ${max}`, 422, 'VALIDATION_ERROR');
  return value;
}

function expectedVersion(value) { return integer(value, 'expectedVersion', { min: 1, max: 1_000_000_000 }); }

module.exports = { objectBody, text, email, password, integer, expectedVersion };
