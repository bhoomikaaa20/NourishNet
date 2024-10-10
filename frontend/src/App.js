import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Ourmission from './Ourmission';
import Footer from './Footer';
import Requestform from './Requestform';
import Contact from './Contact';
import DonateFood from './DonateFood'
import DonateMoney from './DonateMoney'
import Dashboard from './Admin/Dashboard';
import Login from './Admin/Login';
import Home from './Home';

const HARD_CODED_EMAIL = 'admin@gmail.com'; // Replace with your hardcoded email

function App() {
  const [email, setEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (inputEmail) => {
    if (inputEmail === HARD_CODED_EMAIL) {
      setEmail(inputEmail);
      setIsLoggedIn(true);
    } else {
      alert('Invalid email');
    }
  };

  const handleLogout = () => {
    setEmail('');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="App">
        <Navbar isLoggedIn={isLoggedIn} onLogin={handleLogin} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/our-mission" element={<Ourmission />} />
          <Route path="/request-food" element={<Requestform />} />
          <Route path="/donate-food" element={<DonateFood />} />
          <Route path="/donate-money" element={<DonateMoney />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                <Dashboard />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
