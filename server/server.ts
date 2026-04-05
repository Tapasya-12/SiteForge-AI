import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

const app = express();
const port = 3000;

const allowedOrigins = process.env.TRUSTED_ORIGINS?.split(',').map(o => o.trim()) || [];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/https:\/\/site-forge-[a-z0-9-]+\.vercel\.app$/.test(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.get('/', (req: Request, res: Response) => {
  res.send('Server is Live!');
});

app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);
app.use('/api/payment', paymentRoutes);

if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is missing from .env — AI features will not work');
} else {
  console.log('Groq API key loaded successfully');
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});