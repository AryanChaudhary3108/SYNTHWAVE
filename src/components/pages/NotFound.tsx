import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import './NotFound.css';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>404 Not Found | Synthwave Roleplay</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Header />
      <div className="not-found-container unified-body">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">CONNECTION LOST</h2>
          <p className="not-found-desc">
            The coordinates you provided don't exist in this city. 
            Perhaps the transmission was intercepted?
          </p>
          <button className="sub-button" onClick={() => navigate('/')}>
            RETURN TO BASE
            <span className="ping-effect"></span>
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFound;
