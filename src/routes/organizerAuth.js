import { Router } from 'express';
import { z } from 'zod';
import {
  createOrganizer,
  verifyCredentials,
  findById,
} from '../services/organizerService.js';
import {
  signOrganizerToken,
  setAuthCookie,
  clearAuthCookie,
} from '../lib/jwt.js';
import { requireOrganizer } from '../middleware/requireOrganizer.js';
import { loginLimiter, signupLimiter } from '../middleware/rateLimit.js';
import { asyncHandler, httpError } from '../lib/http.js';

export const organizerAuthRouter = Router();

/* ---------- Validation schemas ---------- */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email')
  .max(254);

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters'); // bcrypt hard limit

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Your name is required').max(120),
  email: emailSchema,
  password: passwordSchema,
  orgName: z.string().trim().min(1, 'Organization name is required').max(160),
  orgType: z.enum(['independent', 'venue', 'promoter', 'collective', 'nonprofit']),
  phone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number')
    .max(30)
    .regex(/^[+\d][\d\s-]+$/, 'Enter a valid phone number'),
  website: z
    .string()
    .trim()
    .url('Website must be a valid URL')
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/* ---------- Signup ---------- */

organizerAuthRouter.post(
  '/signup',
  signupLimiter,
  async (req, res) => {
    const data = signupSchema.parse(req.body);

    const organizer = await createOrganizer(data);
    const token = signOrganizerToken(organizer);

    setAuthCookie(res, token);
    res.status(201).json({ organizer });
  }
);

/* ---------- Login ---------- */

organizerAuthRouter.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const organizer = await verifyCredentials(email, password);
    if (!organizer) {
      // Same message for "no such email" and "wrong password" — don't leak which
      throw httpError(401, 'Invalid email or password');
    }

    const token = signOrganizerToken(organizer);
    setAuthCookie(res, token);
    res.json({ organizer });
  })
);

/* ---------- Logout ---------- */

organizerAuthRouter.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

/* ---------- Me ---------- */

organizerAuthRouter.get(
  '/me',
  requireOrganizer,
  asyncHandler(async (req, res) => {
    // requireOrganizer already fetched the row and attached it
    res.json({ organizer: req.organizer });
  })
);