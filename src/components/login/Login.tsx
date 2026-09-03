import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../../supabase";
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
        <h2>Authorize Your Discord Account</h2>
        {error && <p className="error">{error}</p>}
        <button
          onClick={handleLogin}
          className="btn-login"
          disabled={loading}
        >
          {loading ? 'Redirecting...' : 'Connect With Discord'}
        </button>
        <button onClick={handleBack} className="btn-back">
          Back
        </button>
      </div>
    </div>
  );
};

export default Login;