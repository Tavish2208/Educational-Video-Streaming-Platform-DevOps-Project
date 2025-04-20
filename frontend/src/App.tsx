import React, { useEffect } from "react";
import { Switch, Route, useHistory, RouteComponentProps } from "react-router-dom";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Player from "./components/Video/Player";
import Watchlist from "./components/Video/Watchlist";
import Videolist from "./components/Video/Videolist";
import TeacherPanel from "./components/Teacher/TeacherPanel";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { setupAxiosInterceptors } from "./services/api";
import AuthService from "./services/auth";
import TeacherHome from "./components/Teacher/TeacherHome";

setupAxiosInterceptors();

const App: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    // Check authentication for non-auth routes
    if (!AuthService.isAuthenticated() && !["/login", "/register"].includes(window.location.pathname)) {
      history.push("/login");
    }
  }, [history]);

  return (
    <div className="app">
      <Header />
      <main>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <ProtectedRoute path="/watch/:videoId" component={Player} />
          <ProtectedRoute 
            path="/watchlist" 
            component={Watchlist} 
            requiresTeacher={false} 
          />
          <ProtectedRoute 
            path="/teacher" 
            component={TeacherPanel} 
            requiresTeacher={true} 
          />
          <ProtectedRoute
            path="/"
            exact
            render={(props: RouteComponentProps) => {
              if (AuthService.isTeacher()) {
                return <TeacherHome {...props} />;
              }
              return <Videolist {...props} />;
            }}
          />
        </Switch>
      </main>
      <Footer />
    </div>
  );
};

export default App;
