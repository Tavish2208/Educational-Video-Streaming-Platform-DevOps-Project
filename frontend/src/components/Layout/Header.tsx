import React, { useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import AuthService from "../../services/auth";
import "./Header.style.css";

const Header: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());
  const [isTeacher, setIsTeacher] = useState(AuthService.isTeacher());

  useEffect(() => {
    setIsAuthenticated(AuthService.isAuthenticated());
    setIsTeacher(AuthService.isTeacher());
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setIsAuthenticated(false);
      setIsTeacher(false);
      history.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActivePath = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <header>
      <nav>
        <div className="nav-links">
          {isAuthenticated && (
            <>
              <Link to="/" className={isActivePath("/") ? "active" : ""}>
                Home
              </Link>
              {!isTeacher && (
                <Link to="/watchlist" className={isActivePath("/watchlist") ? "active" : ""}>
                  My Watchlist
                </Link>
              )}
              {isTeacher && (
                <Link to="/teacher" className={isActivePath("/teacher") ? "active" : ""}>
                  Teacher Panel
                </Link>
              )}
            </>
          )}
        </div>
        <div className="auth-links">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className={isActivePath("/login") ? "active" : ""}>
                Login
              </Link>
              <Link to="/register" className={isActivePath("/register") ? "active" : ""}>
                Register
              </Link>
            </>
          ) : (
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
