import React from "react";
import { useNavigate } from "react-router-dom";
import whitelist from '../../assets/whitelist.webp';
import "./Whitelist.css";

const Whitelist: React.FC = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/application');
  };

  return (
    <div className="whitelist-applications">
      <div className="whitelist-application">
        <div className="whitelist-title">Whitelist Application</div>
        <div className="whitelist-desc">
          Unlock exclusive opportunities and start a new adventure by choosing your desired path in our vibrant and interactive community.
        </div>
      </div>
      <div className="whitelist">
        <button 
          onClick={handleClick} 
          className="whitelist-card-button" 
          aria-label="Go to Whitelist Application"
        >
          <img
            className="whitelist-card"
            src={whitelist}
            alt="Whitelist application card"
          />
        </button>
      </div>
    </div>
  );
};

export default Whitelist;