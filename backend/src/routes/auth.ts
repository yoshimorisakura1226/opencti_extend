import { Hono } from 'hono';
import { sign } from 'hono/jwt'; // Hono 內建 JWT 函式

const auth = new Hono();

// 硬編碼帳密 (之後建議改為環境變數)
const ADMIN_USER = process.env.OPENCTI_ADMIN_EMAIL;
const ADMIN_PASS = process.env.OPENCTI_ADMIN_PASSWORD;
const JWT_SECRET = "opencti_labels_secret_2026";

if (!ADMIN_PASS) {
    console.error("❌ 錯誤：未設定 OPENCTI_ADMIN_PASS 環境變數");
    process.exit(1); // 缺少必要密碼時直接停止程式
}

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