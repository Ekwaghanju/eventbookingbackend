import { ZodError } from 'zod';
import logger from './logger.js';

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Central error handler. Mounted last.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Zod validation errors → 400 with field-level detail
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      fields: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  const status = err.status ?? 500;
  const expose = err.expose === true;

  if (status >= 500) {
    logger.error({ err, path: req.path }, 'Unhandled error');
  }

  res.status(status).json({
    error: expose ? err.message : 'Something went wrong',
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}