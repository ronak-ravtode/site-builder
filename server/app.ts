import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import userRouter from './routes/user.route';
import projectRouter from './routes/project.route';
import { stripeWebhook } from './controllers/stripeWebhook';

const app = express();

const corsOptions = {
    origin: ['http://localhost:5173', ...(process.env.TRUSTED_ORIGIN?.split(',') || [])],
    credentials: true,
};

app.use(cors(corsOptions));
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all(/^\/api\/auth\/.*/, toNodeHandler(auth));

app.use(express.json({ limit: '50mb' }));

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);

export default app;
