import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ onLogin, onLogout, isLoggedIn }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <h1>FeedForward</h1>
      </div>
      <ul className="nav-menu">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/our-mission">Our Mission</Link>
        </li>
        <li>
          <Link to="/request-food">Request Food</Link>
        </li>
        <li
          className="dropdown"
          onMouseEnter={toggleDropdown}
          onMouseLeave={toggleDropdown}
        >
          <Link to="/donate-food">Donate</Link>
          {showDropdown && (
            <ul className="dropdown-menu">
              <li>
                <Link to="/donate-food">Donate Food</Link>
              </li>
              <li>
                <Link to="/donate-money">Donate Money</Link>
              </li>
            </ul>
          )}
        </li>
        <li>
          <Link to="/contact">Contact Us</Link>
        </li>
        {isLoggedIn && (
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
        )}
      </ul>
      <div className="navbar-donate">
        <a href="/donate-food" className="donate-button">
          Donate
        </a>
      </div>
      <div className="auth-buttons">
        {isLoggedIn ? (
          <button onClick={onLogout}>Logout</button>
        ) : (
          <Link to="/login">
            <button onClick={onLogin}>Login</button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
