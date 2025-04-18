import axios from "axios";
import { API_ENDPOINTS } from "../config/api.config";

const AuthService = {
  async login(email: string, password: string): Promise<void> {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.AUTH}/auth/login`,
        { email, password },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Store role
      if (response.data.role) {
        localStorage.setItem("role", response.data.role);
      }
      localStorage.setItem("isAuthenticated", "true");
    } catch (error) {
      localStorage.removeItem("role");
      localStorage.removeItem("isAuthenticated");
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_ENDPOINTS.AUTH}/auth/logout`, {}, { withCredentials: true });
    } finally {
      localStorage.removeItem("role");
      localStorage.removeItem("isAuthenticated");
    }
  },

  getRole(): string | null {
    return localStorage.getItem("role");
  },

  isStudent(): boolean {
    return localStorage.getItem("role") === "student" && this.isAuthenticated();
  },

  isTeacher(): boolean {
    return localStorage.getItem("role") === "teacher" && this.isAuthenticated();
  },

  isAuthenticated(): boolean {
    return localStorage.getItem("isAuthenticated") === "true";
  },

  isAdmin(): boolean {
    return localStorage.getItem("role") === "admin" && this.isAuthenticated();
  },
};

export default AuthService;
