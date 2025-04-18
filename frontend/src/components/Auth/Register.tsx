import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api.config";
import "./Register.style.css";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // Default role
  const [error, setError] = useState("");
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Registering with:", { email, role });
      const response = await axios.post(`${API_ENDPOINTS.AUTH}/auth/register`, {
        email,
        password,
        role,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log("Registration response:", response.data);
      history.push("/login");
    } catch (error) {
      console.error("Registration error:", error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        <div className="form-group">
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <button className="register-button" type="submit">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;