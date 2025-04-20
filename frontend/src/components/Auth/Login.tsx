import React, { useState } from "react";
import { useHistory, Link } from "react-router-dom";
import AuthService from "../../services/auth"; // Corrected import path
import "./Login.style.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AuthService.login(email, password);
      history.push("/");
    } catch (error) {
      console.error("Login failed:", error);
      setError("Invalid credentials");
    }
  };

  return (
    <div className="login-container">
      <h2>Welcome Back</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        </div>
        <div className="form-group">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        </div>
        <button className="login-button" type="submit">
          Login
        </button>
      </form>
      <div className="login-footer">
        Don't have an account? <Link to="/register">Sign up</Link>
      </div>
    </div>
  );
};

export default Login;
