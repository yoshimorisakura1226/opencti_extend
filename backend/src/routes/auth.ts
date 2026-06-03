import { Hono } from 'hono';
import { sign } from 'hono/jwt'; // Hono 內建 JWT 函式

const auth = new Hono();

// 硬編碼帳密 (之後建議改為環境變數)
const ADMIN_USER = "admin@opencti.io";
const ADMIN_PASS = "sakura";
const JWT_SECRET = "opencti_labels_secret_2026";

auth.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  
  // 比對帳號密碼
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // 產生 JWT Token
    const payload = { username, exp: Math.floor(Date.now() / 1000) + 60 * 60 };
    const token = await sign(payload, JWT_SECRET);
    
    return c.json({ token });
  }

  // 登入失敗
  return c.json({ error: '帳號或密碼不正確！' }, 401);
});

auth.post('/logout', async (c) => {
  // 後端其實不需要做什麼，前端刪除 localStorage 即可
  return c.json({ message: '登出成功' });
});

export default auth;