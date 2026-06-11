// backend/src/index.ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import cron from 'node-cron';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { readFile } from 'node:fs/promises';
import authRoutes from './routes/auth';
import labelRouter from './routes/label';


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
const API_BASE = `http://localhost:${PORT}`;

cron.schedule('* * * * *', async () => {
    const currentTime = `[${new Date().toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '/')}]`;
    console.log(`[${currentTime}]Automatically merges labels running... `);
    try {
        const rules = JSON.parse(await readFile(path.join(__dirname, '../database/merge_rules.json'), 'utf-8'));
        for (const rule of rules) {
            await fetch(`${API_BASE}/api/label/merge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_name: rule.target,
                    source_names: rule.sources
                })
            });
        }
    console.log(`[${new Date()}]Automatically merges finish... `);
    } catch (err) {
        const currentTime = `[${new Date().toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '/')}]`;
        console.error(`[${currentTime}]`);
        console.error("合併排程失敗:", err);
    }
});

cron.schedule('* * * * *', async () => {
    const currentTime = `[${new Date().toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '/')}]`;
    console.log(`[${currentTime}]Automatically creates associations running... `);
    try {
        const rules = JSON.parse(await readFile(path.join(__dirname, '../database/association_rules.json'), 'utf-8'));
        for (const rule of rules) {
            await fetch(`${API_BASE}/api/label/association`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_name: rule.target,
                    conditions: rule.conditions
                })
            });
        }
    console.log(`[${new Date()}]Automatically associations finish... `);
    } catch (err) {
        const currentTime = `[${new Date().toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '/')}]`;
        console.error(`[${currentTime}]`);
        console.error("關聯新增排程失敗:", err);
    }
});
// 啟動伺服器
serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
    const currentTime = `[${new Date().toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '/')}]`;
    console.log(`[${currentTime}]🚀 伺服器已啟動: http://localhost:${info.port}`);
});