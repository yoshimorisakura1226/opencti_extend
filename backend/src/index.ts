// backend/src/index.ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import cron from 'node-cron';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import labelRouter from './routes/label';
import { runMergeTask, runAssociationTask,getCurrentTime } from './routes/label';

const app = new Hono();
const PORT = Number(process.env.PORT) || 8081;

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


// 自動化排程(每日12：00執行合併、13：00執行關聯新增)
cron.schedule(process.env.MERGE_SCHEDULE || '0 12 * * *', runMergeTask);
cron.schedule(process.env.ASSOCIATION_SCHEDULE || '* * * * *', runAssociationTask);

// 啟動伺服器
serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
    console.log(`[${getCurrentTime()}]🚀 伺服器已啟動: http://localhost:${info.port}`);
});