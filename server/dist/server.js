import 'dotenv/config';
import app from './app';
const port = Number(process.env.PORT) || 3000;
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}
export default app;
