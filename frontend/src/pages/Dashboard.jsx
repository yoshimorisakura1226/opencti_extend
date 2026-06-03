import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header'
import DashCard from '../components/layout/DashCard';
import LogOutButton from '../components/auth/LogOutButton';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Header />

      {/* 標籤區塊包裝 */}
      <fieldset className="labels-wrapper">
        <legend className="labels-heading">Labels</legend>
        <div className="labels-grid">
          <DashCard title="Merge" to="/dashboard/labels/merge" />
          <DashCard title="Group" to="/dashboard/labels/groups" />
        </div>
      </fieldset>
        
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;