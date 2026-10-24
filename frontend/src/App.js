import React, { useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Ourmission from "./Ourmission";
import Footer from "./Footer";
import Requestform from "./Requestform";
import Contact from "./Contact";
import DonateFood from "./DonateFood";
import DonateMoney from "./DonateMoney";
import TrackStatus from "./TrackStatus";
import FindFood from "./FindFood";
import Volunteer from "./Volunteer";
import NotFound from "./NotFound";
import Dashboard from "./Admin/Dashboard";
import Login from "./Admin/Login";
import Register from "./Register";
import Account from "./Account";
import Forbidden from "./Forbidden";
import Home from "./Home";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ToastProvider } from "./components/Toast";

// Sends visitors to /login (remembering where they were headed) unless signed in,
// and shows "no access" to signed-in accounts that lack the permission.
// The server enforces the same permissions; this only keeps the UI honest.
const RequirePermission = ({ permission, children }) => {
  const { isLoggedIn, can, checking } = useAuth();
  const location = useLocation();
  if (checking) return <div className="page-loading">Checking your session…</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return can(permission) ? children : <Forbidden />;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="App">
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <ScrollToTop />
            <Navbar />
            <div id="main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/our-mission" element={<Ourmission />} />
                <Route path="/request-food" element={<Requestform />} />
                <Route path="/donate-food" element={<DonateFood />} />
                <Route path="/donate-money" element={<DonateMoney />} />
                <Route path="/find-food" element={<FindFood />} />
                <Route path="/volunteer" element={<Volunteer />} />
                <Route path="/track" element={<TrackStatus />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/account"
                  element={
                    <RequirePermission permission="profile:read">
                      <Account />
                    </RequirePermission>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <RequirePermission permission="dashboard:read">
                      <Dashboard />
                    </RequirePermission>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
