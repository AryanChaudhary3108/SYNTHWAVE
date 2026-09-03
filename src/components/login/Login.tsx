import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../../supabase";
import logoImage from '../../assets/logo.webp';
import './Login.css';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          navigate('/');
        }
      } catch (error) {
        setError('Failed to check session.');
      }
    };

    fetchSession();
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord'
      });
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } catch (error) {
      setError('An unexpected error occurred.');
    }
    setLoading(false);
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img className="login-logo" src={logoImage} alt="OneVision Synthwave" />
        <h1>WELCOME BACK</h1>
        <p className="login-intro">
          Sign in with your Discord account to access your Synthwave account.
        </p>
        {error && <p className="error">{error}</p>}
        <button
          onClick={handleLogin}
          className="btn-login"
          disabled={loading}
        >
          <span className="discord-mark" aria-hidden="true">D</span>
          <span>{loading ? 'REDIRECTING...' : 'LOGIN WITH DISCORD'}</span>
        </button>
        <p className="login-note">
          We only use Discord for authentication. Your account data stays private and secure.
        </p>
        <button onClick={handleBack} className="btn-back">
          RETURN HOME
        </button>
      </div>
    </div>
  );
};

export default Login;