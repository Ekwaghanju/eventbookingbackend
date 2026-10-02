import jwt from 'jsonwebtoken';
import config from './config.js';

export function signOrganizerToken(organizer) {
  return jwt.sign(
    {
      sub: organizer.id,
      email: organizer.email,
      role: 'organizer',
      ver: organizer.token_version,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function verifyOrganizerToken(token) {
  const payload = jwt.verify(token, config.jwt.secret);
  if (payload.role !== 'organizer') {
    throw new Error('Wrong token role');
  }
  return payload;
}

export function setAuthCookie(res, token) {
  res.cookie(config.jwt.cookieName, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    maxAge: config.jwt.cookieMaxAgeMs,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.jwt.cookieName, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    path: '/',
  });
}