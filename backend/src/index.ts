// backend/src/index.ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import authRoutes from './routes/auth';
import labelRouter from './routes/label';
const app = new Hono();

app.route('/api', authRoutes);
app.route('/api/label',labelRouter)
// 啟動伺服器
serve({
  fetch: app.fetch,
  port: 3000
});