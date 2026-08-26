import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
    return null;
  });

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const cookieToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (storedToken) {
        setToken(storedToken);
      }

      if (cookieToken || storedToken) {
        try {
          const res = await axios.post("/api/auth/refresh-token");
          if (res.data?.success) {
            const authToken = res.data.token || cookieToken || storedToken;
            if (authToken) {
              localStorage.setItem("token", authToken);
              setToken(authToken);
            }
            if (res.data.user) {
              setUser(res.data.user);
              localStorage.setItem("user", JSON.stringify(res.data.user));
            }
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          logout();
        }
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [token, user]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url || "";
        if (
          error.response &&
          error.response.status === 401 &&
          !url.includes("/api/auth/login") &&
          !url.includes("/api/auth/admin-login") &&
          !url.includes("/api/auth/register") &&
          !url.includes("/api/auth/refresh-token")
        ) {
          logout();
        }
        return Promise.reject(error);
      },
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post("/api/auth/login", { email, password });
    const newUser = res.data.user;
    const authToken =
      res.data.token ||
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

    if (authToken) {
      setToken(authToken);
      localStorage.setItem("token", authToken);
    }

    if (newUser) {
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    }
    return newUser;
  };

  const adminLogin = async (email, password) => {
    const res = await axios.post("/api/auth/admin-login", { email, password });
    const newUser = res.data.user;

    if (newUser) {
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    }
    return newUser;
  };

  const adminVerifyCredentials = async (email, password) => {
    const res = await axios.post("/api/auth/admin/verify-credentials", { email, password });
    return res.data;
  };

  const adminSend2FA = async (email) => {
    const res = await axios.post("/api/auth/admin/send-2fa", { email });
    return res.data;
  };

  const adminVerify2FA = async (email, otp) => {
    const res = await axios.post("/api/auth/admin/verify-2fa", { email, code: otp });
    const data = res.data;

    if (data?.success && data.user) {
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  };

  const register = async (userData) => {
    await axios.post("/api/auth/register", userData);
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  const updateUserContext = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        adminLogin,
        adminVerifyCredentials,
        adminSend2FA,
        adminVerify2FA,
        register,
        logout,
        updateUserContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
