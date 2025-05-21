import React, { createContext, useContext, useState, useEffect } from "react";
import Keycloak from "keycloak-js";
import { decryptData, encryptData } from "../utils/encryption";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [keycloak, setKeycloak] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const encryptedUserData = localStorage.getItem("userData");
    if (encryptedUserData) {
      /* const userData = JSON.parse(decryptData(encryptedUserData)); */
      const userData = decryptData(encryptedUserData);
      if (userData) {
        setUser(userData);
      }
    }
    setLoading(false);
  }, []);

  const loginInstitutional = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8080/auth/realms/aerobase/protocol/openid-connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: 'docmentor',
          grant_type: 'password',
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || 'Error en la autenticación');
      }

      const tokenData = JSON.parse(atob(data.access_token.split('.')[1]));

      console.log("🔑 Token data:", tokenData);

      const roles = tokenData.realm_access?.roles || [];

      console.log("🔑 Roles:", roles);

      // Identificar si es un usuario institucional
      const isInstitutional = roles.some(role => ['tutor', 'estudiante', 'superadmin'].includes(role));

      console.log("🔑 Es institucional:", isInstitutional);

      const userRoles = isInstitutional ? roles.filter(role =>
        ['tutor', 'estudiante', 'superadmin'].includes(role)
      ) : ['estudiante']; // Si no tiene roles específicos, se asume 'estudiante'

      console.log("🔑 Roles de usuario:", userRoles);

      // Procesar datos del usuario basado en si es institucional o no
      const userData = {
        id: tokenData.sub,
        name: isInstitutional ? tokenData.name : tokenData.preferred_username,
        email: tokenData.email,
        rols: userRoles,
        token: data.access_token,
        isInstitutional
      };

      console.log("🔑 Datos de usuario:", userData);

      setUser(userData);
      localStorage.setItem("userData", encryptData(JSON.stringify(userData)));
      localStorage.setItem("jwtToken", encryptData(userData.token));

      return userData;
    } catch (error) {
      console.error('Error en login institucional:', error);
      throw error;
    }
  };


  const loginAsGuest = (userData) => {
    const guestUser = {
      ...userData, isGuest: true, isInstitutional: false, rols: userData.rols || ["estudiante"]
    };
    setUser(guestUser);
    localStorage.setItem("userData", encryptData(JSON.stringify(guestUser)));
    if (userData.token) {
      localStorage.setItem("jwtToken", encryptData(userData.token));
    }
  };

  const logout = () => {
    if (user?.isGuest || user?.isInstitutional) {
      setUser(null);
      localStorage.removeItem("userData");
      localStorage.removeItem("jwtToken");
    } else if (keycloak) {
      keycloak.logout();
    }
  };


  /* ========================================================= */

  const login = (userData, token) => {
    setUser({ ...userData, token });
    localStorage.setItem("userData", encryptData(JSON.stringify(userData)));
    localStorage.setItem("jwtToken", encryptData(token));
  };


  return (
    <AuthContext.Provider value={{
      user,
      loginAsGuest,
      loginInstitutional,
      logout,
      login,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};