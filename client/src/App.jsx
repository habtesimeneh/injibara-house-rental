import React, { Suspense, lazy, useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LoadingProvider } from "./context/LoadingContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import SEORouteListener from "./components/SEORouteListener";

const Home = lazy(() => import("./pages/Home"));
const Houses = lazy(() => import("./pages/Houses"));
const Categories = lazy(() => import("./pages/Categories"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const MapViewPage = lazy(() => import("./pages/MapViewPage"));

// Fallback loader while lazy-loaded components fetch
const PageLoader = () => (
  <div className="flex justify-center items-center h-screen bg-slate-950">
    <div className="w-full max-w-4xl px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4"
          >
            <div className="h-48 bg-gray-100 rounded-xl animate-shimmer" />
            <div className="space-y-2.5">
              <div className="h-5 bg-gray-100 rounded-lg w-3/4 animate-shimmer" />
              <div className="h-4 bg-gray-100 rounded-md w-1/2 animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function App() {
  const [themeSettings, setThemeSettings] = useState({});

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const res = await axios.get("/api/settings");
        const nextTheme = res?.data || {};
        setThemeSettings({
          primary: nextTheme.primary_color || "#fbbf24",
          secondary: nextTheme.secondary_color || "#f59e0b",
          accent: nextTheme.accent_color || "#1d4ed8",
          brandNameEn: nextTheme.brand_name_en || "Injibara House Rentals",
          brandNameAm: nextTheme.brand_name_am || "እንጅባራ የቤት ኪራይ",
        });
      } catch (error) {
        console.error("Failed to load theme settings:", error);
      }
    };

    loadTheme();
  }, []);

  const themeStyle = {
    "--theme-primary": themeSettings.primary || "#fbbf24",
    "--theme-secondary": themeSettings.secondary || "#f59e0b",
    "--theme-accent": themeSettings.accent || "#1d4ed8",
  };

  return (
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <div
            className="min-h-screen flex flex-col bg-slate-950 text-white font-sans"
            style={themeStyle}
          >
            <Navbar />
            <main className="flex-grow">
              <Suspense fallback={<PageLoader />}>
                <SEORouteListener />
                <Routes>
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Home />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/houses"
                    element={
                      <PrivateRoute>
                        <Houses />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/map"
                    element={
                      <PrivateRoute>
                        <MapViewPage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/categories"
                    element={
                      <PrivateRoute>
                        <Categories />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/about"
                    element={
                      <PrivateRoute>
                        <About />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <PrivateRoute>
                        <Contact />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/messages"
                    element={
                      <PrivateRoute>
                        <Messages />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <PrivateRoute roles={["Admin"]}>
                        <AdminDashboard />
                      </PrivateRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </Router>
      </LoadingProvider>
    </AuthProvider>
  );
}
