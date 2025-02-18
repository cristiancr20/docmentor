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
      const userData = JSON.parse(decryptData(encryptedUserData));
      setUser(userData);
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

      const roles = tokenData.realm_access?.roles || [];

      // Cambiar esta parte para obtener todos los roles relevantes
      const userRoles = tokenData.realm_access?.roles?.filter(role =>
        ['tutor', 'estudiante', 'superadmin'].includes(role)
      ) ;
      
      const userData = {
        id: tokenData.sub,
        name: tokenData.name || tokenData.preferred_username,
        email: tokenData.email,
        rol: userRoles.length > 0 ? userRoles : ['estudiante'], // Guardar array de roles
        token: data.access_token,
        isInstitutional: true
      };

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
    const guestUser = { ...userData, isGuest: true, isInstitutional: false };
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