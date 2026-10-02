import { Router } from 'express';
//import { query } from '../lib/db.js';
import db from '../lib/db.js';
import { asyncHandler } from '../lib/http.js';
import logger from '../lib/logger.js';

export const healthRouter = Router();

// Liveness — is the process up?
healthRouter.get('/', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

// Readiness — can it serve traffic (DB reachable)?
healthRouter.get(
    '/ready',
    asyncHandler(async (req, res) => {
        try {
            await db.query('SELECT 1');
            logger.info('Database is up');
            res.json({ ok: true, db: 'up' });
        } catch {
            logger.error('Database is down');
            res.status(503).json({ ok: false, db: 'down' });
        }
    })
);


healthRouter.get('/db', async(req, res) => {
    try {
        await db.query('SELECT 1');
        logger.info('Database is up');
        res.json({ ok: true, db: 'up' });
    } catch {
        logger.error('Database is down');
        res.status(503).json({ ok: false, db: 'down' });
    }
});