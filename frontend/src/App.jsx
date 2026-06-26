// frontend/src/App.jsx
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import LabelMergePage from './pages/labels/labelMerge';
import LabelGroupPage from './pages/labels/labelGroups';
import LabelSearchPage from './pages/labels/labelSearch';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const idleTimer = useRef(null);

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    // 設定 10 分鐘 (10 * 60 * 1000 ms)
    idleTimer.current = setTimeout(() => {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      alert('閒置時間過長，已自動登出');
    }, 10 * 60 * 1000);
  };

  useEffect(() => {
    if (isLoggedIn) {
      window.addEventListener('mousemove', resetIdleTimer);
      window.addEventListener('keydown', resetIdleTimer);
      resetIdleTimer();
    }
    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [isLoggedIn]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}>
        </Route>
        <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
        <Route path="/dashboard/labels/merge" element={<LabelMergePage />} />
        <Route path="/dashboard/labels/groups" element={<LabelGroupPage />} />
        <Route path="/dashboard/labels/groups" element={<LabelSearchPage />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;