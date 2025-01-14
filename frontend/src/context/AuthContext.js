// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { decryptData, encryptData } from "../utils/encryption";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar el usuario desde localStorage cuando la app se monta
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const encryptedUserData = localStorage.getItem("userData");
        if (encryptedUserData) {
          const userData = JSON.parse(decryptData(encryptedUserData));
          setUser(userData);
        }
      } catch (error) {
        console.error("Error al cargar los datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (userData, jwt) => {
    setUser(userData);
    localStorage.setItem("userData", encryptData(JSON.stringify(userData)));
    localStorage.setItem("jwtToken", encryptData(jwt));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userData");
    localStorage.removeItem("jwtToken");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
