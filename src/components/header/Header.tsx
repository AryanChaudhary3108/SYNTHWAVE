import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import { BookOpen, Grid2X2, LogOut } from 'lucide-react';
import './Header.css';

type Admin = {
  email: string;
};

const Header: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [admins, setAdmins] = useState<string[]>([]);
  const profileContainerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDropdownOpen(false);
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [dropdownOpen]);

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

  // Applications and Tickets are temporarily disabled across the website.

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
  const fullName = user_metadata?.full_name || 'PLAYER';

  return (
    <header className="header">
      <button className="logo" onClick={() => navigate('/')} aria-label="Go to home page">
        <img src="/FEVICON.webp" alt="Synthwave Roleplay logo" />
      </button>
      <nav className="navigation" aria-label="Primary navigation">
        <button className="nav-link" onClick={() => navigate('/rules')}>
          <BookOpen size={16} strokeWidth={1.8} />
          RULES
        </button>
        <a
          className="nav-link"
          href="https://discord.gg/ygSGMfBFeS"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="discord-nav-mark" aria-hidden="true"><span>●</span><span>●</span></span>
          JOIN DISCORD
        </a>
      </nav>
      {user ? (
        <div className="profile-container" ref={profileContainerRef}>
          <button className="connect-button" onClick={handleConnectClick}>
            JOIN SYNTHWAVE
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
              <div className="dropdown-profile">
                <div className="dropdown-avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User profile avatar" />
                  ) : (
                    <span>{fullName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="dropdown-identity">
                  <strong>{toPascalCase(fullName)}</strong>
                  <span>SYNTHWAVE MEMBER</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              {isAdmin && (
                <div className="dropdown-item active" onClick={handleDashboardClick}>
                  <Grid2X2 size={19} strokeWidth={1.8} />
                  <span>DASHBOARD</span>
                </div>
              )}
              {/*
              <div className="dropdown-item" onClick={handleApplicationClick}>
                <FileText size={20} strokeWidth={1.8} />
                <span>APPLICATIONS</span>
              </div>
              <div className="dropdown-item" onClick={handleSupportClick}>
                <MessageSquare size={20} strokeWidth={1.8} />
                <span>TICKETS</span>
              </div>
              */}
              <div className="dropdown-divider" />
              <div className="dropdown-item sign-out" onClick={handleLogoutClick}>
                <LogOut size={20} strokeWidth={1.8} />
                <span>SIGN OUT</span>
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