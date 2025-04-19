import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";
import AuthService from "../../services/auth";

interface ProtectedRouteProps extends Omit<RouteProps, 'component'> {
  component?: React.ComponentType<any>;
  requiresTeacher?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  requiresTeacher = false,
  ...rest
}) => {
  return (
    <Route
      {...rest}
      render={props => {
        if (!AuthService.isAuthenticated()) {
          return <Redirect to="/login" />;
        }

        if (requiresTeacher && !AuthService.isTeacher()) {
          return <Redirect to="/" />;
        }

        if (Component) {
          return <Component {...props} />;
        }

        // If no component is provided, use the render prop from ...rest
        return rest.render ? rest.render(props) : null;
      }}
    />
  );
};

export default ProtectedRoute;
