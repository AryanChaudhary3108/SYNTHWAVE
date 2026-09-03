import React from "react";
import { useNavigate } from "react-router-dom";
import { FaDiscord, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import logoImage from "../../assets/logo.webp";
import "./Footer.css";

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("onevisionroleplayy@gmail.com");
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">
          <img
            src={logoImage}
            alt="Synthwave Roleplay logo"
          />
          <p className="business-inquiries">
            <span className="inquiries-text">For Business Inquiries:</span>
            <a
              href="mailto:onevisionroleplayy@gmail.com"
              className="business-link"
              onClick={handleCopyEmail}
              aria-label="Copy email to clipboard">
              onevisionroleplayy@gmail.com
            </a>
          </p>
        </div>
        <div className="footer-links">
          <ul>
            <li>
              <button
                className="footer-link-button"
                onClick={() => navigate("/privacy")}
                aria-label="Privacy Policy"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                className="footer-link-button"
                onClick={() => navigate("/rules")}
                aria-label="Rules"
              >
                Rules
              </button>
            </li>
          </ul>
        </div>
        <div className="footer-divider"></div>

        <div className="footer-social">
          <ul>
            <li>
              <a
                href="https://discord.gg/ygSGMfBFeS"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
              >
                <FaDiscord /> Discord
              </a>
            </li>
            <li>
              <a
                href="https://x.com/OneVision_RP"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter (X)"
              >
                <FaXTwitter /> X
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@onevisionrp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <FaYoutube /> YouTube
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-copyright">
        <p>&copy; {new Date().getFullYear()} Synthwave Roleplay. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
