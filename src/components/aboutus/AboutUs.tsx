import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mantine/core';
import collageImage from '../../assets/collage.webp';
import './AboutUs.css';

const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="about-us">
      <div className="about-us-content">
        <div className="about-us-text">
          <h2 className="about-us-title">About Us</h2>
          <p className="about-us-description">
            Welcome to the Synthwave Roleplay! Get ready for an exciting adventure
            filled with chaos and fun. Join us as we dive into thrilling scenarios,
            unpredictable events, and epic character stories. Whether you're a seasoned
            roleplayer or new to the scene, there’s something for everyone. Stay tuned
            for more updates and prepare for a wild ride!
          </p>
          <div className="about-us-buttons">
            <Button
              variant="default"
              style={{ fontWeight: '400' }}
              onClick={() => window.open('https://discord.com/invite/onevision', '_blank')}>
              Join Discord
            </Button>
            <Button
              variant="default"
              style={{ fontWeight: '400' }}
              onClick={() => navigate('/rules')}>
              Read Rules
            </Button>
          </div>
        </div>
        <div className="about-us-image">
          <img
            src={collageImage}
            className="aboutus-img"
            alt="About Us"
          />
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
