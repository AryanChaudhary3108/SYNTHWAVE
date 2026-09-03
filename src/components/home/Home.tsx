import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "../../supabase";
import AboutUs from "../aboutus/AboutUs";
import Subscriptions from "../subscription/Subscriptions";
import Whitelist from "../whitelist/Whitelist";
import JobApplication from "../jobapp/JobApplication";
import "./Home.css";

const Home: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    fetchUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="app unified-body">
      <Helmet>
        <title>Synthwave Roleplay | Immersive GTA V Roleplay</title>
        <meta name="description" content="Step into a world of endless possibilities, where creativity knows no bounds. Join our vibrant community to craft, share, and roleplay in a city built by imagination." />
        <link rel="canonical" href="https://synthwave.in/" />
      </Helmet>
      <div>
        <div className="header-section">
          <div className="hero-copy">
            <h1 className="title">
              Together, We Stand with <span className="title-accent">Synthwave</span>, Moving Toward <span className="title-highlight">Endless Possibilities</span>
            </h1>
            <div className="description">
              Step into a world of endless possibilities, where creativity knows no bounds.
              Join our vibrant community to craft, share, and roleplay in a city built by imagination.
              Your adventure begins here!
            </div>
          </div>
          <div className="img-wrapper">
            <img
              src="/stick.webp"
              className="img-right"
              alt="Synthwave Roleplay emblem"
            />
          </div>
        </div>
      </div>
      <AboutUs />
      <Subscriptions />
      {/* {user && <Whitelist />} */}
      {/* <JobApplication /> */}
    </div>
  );
};

export default Home;