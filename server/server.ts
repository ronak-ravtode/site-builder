import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/user.route.js';
import projectRouter from './routes/project.route.js';
import { stripeWebhook } from './controllers/stripeWebhook.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT) || 3000;

const app = express();

const trustedOrigins = [
    'http://localhost:5173',
    ...(process.env.TRUSTED_ORIGIN?.split(',') || []),
]
    .map((o) => o.trim())
    .filter(Boolean);

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (trustedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
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

// Serve static files from the client/dist directory
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Catch-all route to serve the frontend for any non-API routes
app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

export default app;