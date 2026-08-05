import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Home,
  Trophy,
  Award,
  BarChart3,
  Users,
  Shield,
  Contrast,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ArmyLogo from "./ArmyLogo";
import "./Navbar.css";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { highContrast, toggleHighContrast } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const close = () => setOpen(false);

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand" onClick={close}>
          <ArmyLogo size={42} className="brand-emblem-img" />
          <div className="brand-text">
            <span className="brand-title">Bangladesh Army</span>
            <span className="brand-sub">Cyber Awareness Training</span>
          </div>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`navbar-links ${open ? "open" : ""}`} aria-label="Main">
          <NavLink to="/" end onClick={close}>
            <Home size={16} /> Home
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" onClick={close}>
                <LayoutDashboard size={16} /> Dashboard
              </NavLink>
              <NavLink to="/modules" onClick={close}>
                <BookOpen size={16} /> Modules
              </NavLink>
              <NavLink to="/leaderboard" onClick={close}>
                <Trophy size={16} /> Leaderboard
              </NavLink>
              <NavLink to="/certificate" onClick={close}>
                <Award size={16} /> Certificate
              </NavLink>
              <NavLink to="/reports" onClick={close}>
                <BarChart3 size={16} /> Reports
              </NavLink>
              {(user?.role === "instructor" || user?.role === "admin") && (
                <NavLink to="/instructor" onClick={close}>
                  <Users size={16} /> Instructor
                </NavLink>
              )}
              {user?.role === "admin" && (
                <NavLink to="/admin" onClick={close}>
                  <Shield size={16} /> Admin
                </NavLink>
              )}
            </>
          )}

          <div className="navbar-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={toggleHighContrast}
              aria-pressed={highContrast}
              title="Toggle high-contrast mode"
            >
              <Contrast size={15} />
              <span className="nav-hc-label">{highContrast ? "HC On" : "HC"}</span>
            </button>
            {isAuthenticated && user ? (
              <>
                <div className="user-chip">
                  <span className="user-rank">{user.rank}</span>
                  <span className="user-name">{user.displayName}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm" onClick={close}>
                Training Login
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
