import React, { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "./supabase";
import Login from "./components/login/Login";
import Header from "./components/header/Header";
import Home from "./components/home/Home";
import Footer from "./components/footer/Footer";
import PrivacyPolicy from "./components/pages/PrivacyPolicy";
import Rules from "./components/pages/Rules";
import Dashboard from "./components/admin/Dashboard";
// import Application from "./components/form/ApplicationForm";
// import Support from "./components/support/SupportTicket";
import Queue from "./components/queue/QueueSystem";

const Layout: React.FC = () => (
  <>
    <Header />
    <Home />
    <Footer />
  </>
);

const pageVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={{ duration: 0.5 }}>
    {children}
  </motion.div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; condition: boolean }> = ({ children, condition }) => {
  return condition ? <>{children}</> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session }, } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
          const { data: adminData, error } = await supabase
            .from("admins")
            .select("role")
            .eq("email", session.user.email)
            .single();

          if (error) {
            console.error("Error fetching admin role:", error);
          } else {
            setIsAdmin(adminData?.role === "admin");
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
    },
    {
      path: "/login",
      element: <PageTransition><Login /></PageTransition>,
    },
    {
      path: "/privacy",
      element: <PageTransition><PrivacyPolicy /></PageTransition>,
    },
    {
      path: "/rules",
      element: (
        <PageTransition>
          <Header />
          <Rules />
          <Footer />
        </PageTransition>
      ),
    },
    {
      path: "/queue",
      element: <PageTransition><Queue /></PageTransition>,
    },
    {
      path: "/dashboard",
      element: (
        <PageTransition>
          <ProtectedRoute condition={user && isAdmin}>
            <Dashboard />
          </ProtectedRoute>
        </PageTransition>
      ),
    },
    /*
    {
      path: "/application",
      element: (
        <PageTransition>
          <ProtectedRoute condition={!!user}>
            <Application />
          </ProtectedRoute>
        </PageTransition>
      ),
    },
    {
      path: "/support",
      element: (
        <PageTransition>
          <ProtectedRoute condition={!!user}>
            <Support />
          </ProtectedRoute>
        </PageTransition>
      ),
    },
    */
    {
      path: "*",
      element: <Navigate to="/" replace />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default App;