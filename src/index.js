import express from 'express';
import pool from './lib/db.js'; 
import config from './lib/config.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';


import { healthRouter } from './routes/health.js';
import { organizerAuthRouter } from './routes/organizerauth.js';

const app = express();
app.use(express.json());

config.cors.origins.forEach((origin) => {
  app.use(cors({
    origin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
});


// cookie-parser
app.use(cookieParser());



//Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/organizerauth', organizerAuthRouter);


app.listen(config.port, () => console.log(`Server running on port ${config.port}`));