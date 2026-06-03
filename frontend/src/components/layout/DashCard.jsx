import { Link } from 'react-router-dom';
import './DashCard.css'; // 建議將樣式抽離

const DashCard = ({ title, description, to }) => {
  return (
    <Link to={to} className="dash-card">
      <div className="card-content">
        <h4>{title}</h4>
      </div>
    </Link>
  );
};

export default DashCard;