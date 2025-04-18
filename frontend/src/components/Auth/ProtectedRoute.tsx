import React, { useEffect } from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import AuthService from "../../services/auth";

interface ProtectedRouteProps extends RouteProps {
  requiresTeacher?: boolean;
  component: React.ComponentType<any>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, requiresTeacher = false, ...rest }) => {
  const isAuthenticated = AuthService.isAuthenticated();
  const isTeacher = AuthService.isTeacher();

  useEffect(() => {
    // Force check authentication and teacher status
    if (!isAuthenticated) {
      return;
    }
    if (requiresTeacher && !isTeacher) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isTeacher, requiresTeacher]);

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          requiresTeacher && !isTeacher ? (
            <Redirect to="/" />
          ) : (
            <Component {...props} />
          )
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location },
            }}
          />
        )
      }
    />
  );
};

export default ProtectedRoute;
