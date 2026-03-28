import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { router } from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL || '',
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting apenas no login (proteção contra brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,                   // máx 20 tentativas por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

app.use('/api/v1/auth/login', loginLimiter);

app.use('/api/v1', router);

app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

app.use(errorHandler);

export { app };
