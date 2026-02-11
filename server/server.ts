import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/user.route.js';
import projectRouter from './routes/project.route.js';

const app = express();

const port = 3000;

const corsOptions = {
    origin: ['http://localhost:5173', ...(process.env.TRUSTED_ORIGIN?.split(',') || [])],
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all(/^\/api\/auth\/.*/, toNodeHandler(auth));

app.use(express.json({limit:'50mb'}));

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/user',userRouter);
app.use('/api/project',projectRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});