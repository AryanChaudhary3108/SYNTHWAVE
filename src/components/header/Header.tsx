import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { Divider } from '@mantine/core';
import logoImage from '../../assets/logo.webp';
import logoGif from '../../assets/logogif.webp';
import './Header.css';

type Admin = {
  email: string;
};

const Header: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [admins, setAdmins] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error('Error fetching session:', error);
      setUser(session?.user || null);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      const { data, error } = await supabase.from('admins').select('email');
      if (error) {
        console.error("Error fetching admins:", error.message);
        return;
      }
      setAdmins(data.map((admin: Admin) => admin.email));
    };

    if (user) fetchAdmins();
  }, [user]);

  const handleLoginClick = () => navigate('/login');

  const handleLogoutClick = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDropdownOpen(false);
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
    setDropdownOpen(false);
  };

  const handleSupportClick = () => {
    navigate('/support');
    setDropdownOpen(false);
  };

  const handleConnectClick = () => {
    const connectUrl = "fivem://connect/117.242.46.44";
    window.location.href = connectUrl;
  };

  const toggleDropdown = () => {
    setDropdownOpen((prevState) => !prevState);
  };

  const toPascalCase = (str: string): string => {
    return str
      .split(' ')
      .map(word => 
        word
          .charAt(0).toUpperCase() + 
          word.slice(1).replace(/x$/, 'X')
      )
      .join(' ');
  };

  const isAdmin = user?.email && admins.some(
    (admin) => admin.toLowerCase() === user.email.toLowerCase()
  );
  const { user_metadata } = user || {};
  const avatarUrl = user_metadata?.avatar_url;
  const fullName = user_metadata?.full_name || user?.email;

  return (
    <header className="header">
      <div className="logo">
        <img src={logoImage} alt="Synthwave Roleplay logo" />

      </div>
      <div className="center-logo">
        <img src={logoGif} alt="Logo" />
      </div>
      {user ? (
        <div className="profile-container">
          <button className="connect-button" onClick={handleConnectClick}>
            Connect
            <span className="ping-effect"></span>
          </button>
          <div className="avatar"
            onClick={toggleDropdown}
            role="button"
            aria-label="User Menu">
            {avatarUrl ? (
              <img src={avatarUrl} alt="User Avatar" />
            ) : (
              <div className="avatar-placeholder">{fullName}</div>
            )}
          </div>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item username">
                {fullName ? toPascalCase(fullName) : ''}
              </div>
              {isAdmin && (
                <div className="dropdown-item" onClick={handleDashboardClick}>
                  Dashboard
                </div>
              )}
              <div className="dropdown-item" onClick={handleSupportClick}>
                Support
              </div>
              <Divider color="#444444" style={{ margin: '8px 0' }} />
              <div className="dropdown-item" onClick={handleLogoutClick}>
                Logout
              </div>
            </div>
          )}
        </div>
      ) : (
        <button className="login-btn" onClick={handleLoginClick}>
          LOG IN
        </button>
      )}
    </header>
  );
};

export default Header;