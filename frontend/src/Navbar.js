import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./components/AuthContext";

const MENUS = [
  {
    key: "get",
    label: "Get Food",
    items: [
      { to: "/find-food", label: "Find available food", icon: "fa-basket-shopping" },
      { to: "/request-food", label: "Request food", icon: "fa-hand-holding-hand" },
    ],
  },
  {
    key: "give",
    label: "Donate",
    items: [
      { to: "/donate-food", label: "Donate food", icon: "fa-hand-holding-heart" },
      { to: "/donate-money", label: "Donate money", icon: "fa-indian-rupee-sign" },
    ],
  },
];

const Navbar = () => {
  const { isLoggedIn, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();
  const navRef = useRef(null);

  // Close menus whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  // Close an open dropdown on outside click or Escape.
  useEffect(() => {
    if (!openDropdown) return undefined;
    const onClick = (e) => !navRef.current?.contains(e.target) && setOpenDropdown(null);
    const onKey = (e) => e.key === "Escape" && setOpenDropdown(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openDropdown]);

  return (
    <header className="navbar">
      <div className="navbar-inner" ref={navRef}>
        <Link to="/" className="brand" aria-label="NourishNet home">
          <i className="fa-solid fa-leaf" aria-hidden="true" />
          <span>NourishNet</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
        </button>

        <nav id="primary-nav" className={`nav${menuOpen ? " open" : ""}`} aria-label="Primary">
          <ul className="nav-menu">
            <li>
              <NavLink to="/" end>
                Home
              </NavLink>
            </li>
            {MENUS.map((m) => {
              const open = openDropdown === m.key;
              const active = m.items.some((i) => i.to === location.pathname);
              return (
                <li key={m.key} className={`dropdown${open ? " open" : ""}`}>
                  <button
                    type="button"
                    className={`dropdown-toggle${active ? " active" : ""}`}
                    aria-expanded={open}
                    aria-controls={`menu-${m.key}`}
                    onClick={() => setOpenDropdown(open ? null : m.key)}
                  >
                    {m.label} <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                  </button>
                  <ul className="dropdown-menu" id={`menu-${m.key}`}>
                    {m.items.map((i) => (
                      <li key={i.to}>
                        <NavLink to={i.to}>
                          <i className={`fa-solid ${i.icon}`} aria-hidden="true" /> {i.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
            <li>
              <NavLink to="/volunteer">Volunteer</NavLink>
            </li>
            <li>
              <NavLink to="/our-mission">Our Mission</NavLink>
            </li>
            <li>
              <NavLink to="/track">Track</NavLink>
            </li>
            <li>
              <NavLink to="/contact">Contact</NavLink>
            </li>
            {isLoggedIn && (
              <li>
                <NavLink to="/dashboard">Dashboard</NavLink>
              </li>
            )}
          </ul>

          <div className="nav-actions">
            <Link to="/donate-food" className="btn btn-accent btn-sm">
              <i className="fa-solid fa-heart" aria-hidden="true" /> Donate
            </Link>
            {isLoggedIn ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn btn-ghost btn-sm" aria-label="Admin login">
                <i className="fa-solid fa-user-shield" aria-hidden="true" />
                <span className="nav-login-text">Admin</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
