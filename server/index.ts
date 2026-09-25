// ===========================================
// server/index.ts
// Punto de entrada del backend Express.
// Uso: npm run dev:api  (o npm run dev para arrancar todo)
// ===========================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env, isDev } from './env.js';
import { healthRouter } from './routes/health.js';

const app = express();

// ─── Middleware de seguridad ───
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ───
const allowedOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (curl, Postman, apps móviles)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || isDev) {
      return callback(null, true);
    }
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
}));

// ─── Parsers ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ───
app.use(morgan(isDev ? 'dev' : 'combined'));

// ─── Rutas API ───
app.use('/api', healthRouter);

// ─── 404 para rutas desconocidas ───
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint no encontrado' });
});

// ─── Manejador central de errores ───
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error no manejado:', err);
  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message : 'Error interno del servidor',
  });
});

// ─── Arrancar servidor ───
const server = app.listen(env.PORT, () => {
  console.log('');
  console.log('🚀 Ateendia CRM API');
  console.log(`   → Entorno:  ${env.NODE_ENV}`);
  console.log(`   → Puerto:   ${env.PORT}`);
  console.log(`   → URL:      http://localhost:${env.PORT}/api/health`);
  console.log(`   → CORS:     ${allowedOrigins.join(', ')}`);
  console.log('');
});

// ─── Graceful shutdown ───
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Ctrl+C, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});