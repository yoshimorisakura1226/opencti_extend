// backend/src/index.ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import labelRouter from './routes/label';


const app = new Hono();

app.route('/api', authRoutes);
app.route('/api/label',labelRouter);

const staticPath = path.join(__dirname, '../../frontend/dist');
app.use('/*', serveStatic({ root: staticPath }));
app.get('*', async (c) => {
  const filePath = path.join(staticPath, 'index.html');
  
  // 檢查檔案是否存在
  if (fs.existsSync(filePath)) {
    return c.html(fs.readFileSync(filePath, 'utf-8'));
  }
  
  return c.text('Not Found', 404);
});

// 啟動伺服器
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`🚀 伺服器已啟動: http://localhost:${info.port}`);
});