import { useState } from 'react';
import './auth.css'; // 引入模組化 CSS

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ username: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem('token', token);
      onLogin();
    } else {
      alert('OpenCTI 驗證失敗，請檢查帳號密碼');
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <h2 className="login-title">OpenCTI 擴充工具</h2>
        <p className="login-desc">請輸入管理員憑證以解鎖後台存取權限</p>
        
        <input 
          className="login-input"
          type="text" 
          placeholder="管理員帳號" 
          onChange={(e) => setForm({...form, username: e.target.value})} 
        />
        <input 
          className="login-input"
          type="password" 
          placeholder="安全密碼" 
          onChange={(e) => setForm({...form, password: e.target.value})} 
        />
        
        <button type="submit" className="login-button">
          驗證並解鎖
        </button>
      </form>
    </div>
  );
};
export default Login;