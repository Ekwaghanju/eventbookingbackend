import { verifyOrganizerToken } from '../lib/jwt.js';
import { findById } from '../services/organizerService.js';
import { httpError } from '../lib/http.js';
import config from '../lib/config.js';

export async function requireOrganizer(req, res, next) {
  try {
    const token =
      req.cookies?.[config.jwt.cookieName] ??
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) throw httpError(401, 'Not signed in');

    let payload;
    try {
      payload = verifyOrganizerToken(token);
    } catch {
      throw httpError(401, 'Session expired');
    }

    const organizer = await findById(payload.sub);
    if (!organizer) throw httpError(401, 'Account not found');
    if (organizer.status !== 'active') throw httpError(403, 'Account is not active');

    // Token version check — rejects tokens issued before the last bump
    if (payload.ver !== organizer.token_version) {
      throw httpError(401, 'Session expired');
    }

    req.organizer = organizer;
    next();
  } catch (err) {
    next(err);
  }
}