import React from "react";
import { useNavigate } from "react-router-dom";
import "./PrivacyPolicy.css";

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="privacy-policy">
      <h1>Privacy Policy</h1>
      <p>
        Your privacy is important to us. This policy outlines how we collect, use, and protect your information.
      </p>
      <h2>Information We Collect</h2>
      <ul>
        <li>Personal details you provide, such as your email address.</li>
        <li>Usage data collected through cookies.</li>
      </ul>
      <h2>How We Use Your Information</h2>
      <p>
        We use your data to improve our services, communicate with you, and ensure a safe experience.
      </p>
      <p>
        For questions, please <a href="https://discord.gg/ygSGMfBFeS">contact us</a>.
      </p>
      <div className="navigation-buttons">
        <button onClick={handleGoBack}>Go Back</button>
      </div>
    </div>
  );
};

export default PrivacyPolicy;