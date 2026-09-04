import React, { useEffect, useState, Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "./supabase";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Home from "./components/home/Home";

// Lazy loaded routes for performance (code splitting)
const Login = lazy(() => import("./components/login/Login"));
const PrivacyPolicy = lazy(() => import("./components/pages/PrivacyPolicy"));
const Rules = lazy(() => import("./components/pages/Rules"));
const Dashboard = lazy(() => import("./components/admin/Dashboard"));
const Queue = lazy(() => import("./components/queue/QueueSystem"));
const NotFound = lazy(() => import("./components/pages/NotFound"));

const Layout: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />
      <Home />
      <Footer />
    </>
  );
};

const pageVariants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.5 }}>
      {children}
    </motion.div>
  );
};

// Fallback for Suspense
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#00b4d8' }}>
    LOADING SYSTEM...
  </div>
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
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
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
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <PageTransition><Login /></PageTransition>
        </Suspense>
      ),
    },
    {
      path: "/privacy",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <PageTransition><PrivacyPolicy /></PageTransition>
        </Suspense>
      ),
    },
    {
      path: "/rules",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <PageTransition>
            <Header />
            <Rules />
            <Footer />
          </PageTransition>
        </Suspense>
      ),
    },
    {
      path: "/queue",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <PageTransition><Queue /></PageTransition>
        </Suspense>
      ),
    },
    {
      path: "/dashboard",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <PageTransition>
            <ProtectedRoute condition={user && isAdmin}>
              <Dashboard />
            </ProtectedRoute>
          </PageTransition>
        </Suspense>
      ),
    },
    {
      path: "*",
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <NotFound />
        </Suspense>
      ),
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default App;