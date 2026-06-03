import { useNavigate } from 'react-router-dom';
import './auth.css'
const LogOutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 呼叫後端 Logout (選用，若後端無特殊處理也可直接跳過這步)
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      // 無論後端是否成功，一定要清除本地 Token
      localStorage.removeItem('token');
      // 強制頁面跳轉回登入頁，並觸發 App.jsx 的狀態更新
      window.location.href = '/login'; 
    }
  };

  return <button className='logout-button' onClick={handleLogout}>登出</button>;
};

export default LogOutButton;