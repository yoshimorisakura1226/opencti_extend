// src/components/layout/Header.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import LogOutButton from '../auth/LogOutButton';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 只有當前路徑不是 "/" 時才顯示返回箭頭
  const showBackButton = location.pathname !== '/dashboard';

  // 定義樣式物件
  const headerStyle = {
    width:`85vw`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 0 30px 0',
    position: 'relative', // 確保返回按鈕可透過絕對定位放置
  };

  const titleStyle = {
    color: '#d1d5db',
    margin: '0',
    flexGrow: 1, // 讓標題佔據空間
    textAlign: 'center' // 標題置中
  };

  return (
    <header style={headerStyle}>
      {/* 返回按鈕 */}
      {showBackButton && (
        <div className="back-arrow" onClick={() => navigate('/')}>
          ← 返回
        </div>
      )}

      <h1 style={titleStyle}>OpenCTI Command</h1>
      
      <LogOutButton />
    </header>
  );
};

export default Header;