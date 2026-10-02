import express from 'express';
import pool from './lib/db.js'; 
import { healthRouter } from './routes/health.js';

const app = express();
app.use(express.json());

const port = process.env.PORT;


//Routes
app.use('/api/v1/health', healthRouter);


app.listen(port, () => console.log(`Server running on port ${port}`));