import axios from "axios";
import { API_ENDPOINTS } from "../config/api.config";

interface User {
  role: string;
  // add other user properties as needed
}

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

      // Store user data and role
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("isAuthenticated", "true");
      }
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("isAuthenticated");
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_ENDPOINTS.AUTH}/auth/logout`, {}, { withCredentials: true });
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("isAuthenticated");
    }
  },

  getRole(): string | null {
    return localStorage.getItem("role");
  },

  isStudent(): boolean {
    return this.getRole() === "student" && this.isAuthenticated();
  },

  isTeacher(): boolean {
    return this.getRole() === "teacher" && this.isAuthenticated();
  },

  isAuthenticated(): boolean {
    return localStorage.getItem("isAuthenticated") === "true";
  },

  isAdmin(): boolean {
    return this.getRole() === "admin" && this.isAuthenticated();
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
};

export default AuthService;
