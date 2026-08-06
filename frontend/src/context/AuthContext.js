import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { decryptData, encryptData } from "../utils/encryption";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [keycloak] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const encryptedUserData = localStorage.getItem("userData");
    const encryptedToken = localStorage.getItem("jwtToken");
    if (encryptedUserData) {
      const userData = decryptData(encryptedUserData);
      if (userData) {
        // El token no se guarda dentro de userData; sin rehidratarlo aquí, las
        // llamadas que dependen de `user.token` fallan tras recargar la página.
        const token = encryptedToken ? decryptData(encryptedToken) : null;
        setUser({ ...userData, token: userData.token ?? token });
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


      const roles = tokenData.realm_access?.roles || [];


      // Identificar si es un usuario institucional
      const isInstitutional = roles.some(role => ['tutor', 'estudiante', 'superadmin'].includes(role));


      const userRoles = isInstitutional ? roles.filter(role =>
        ['tutor', 'estudiante', 'superadmin'].includes(role)
      ) : ['estudiante']; // Si no tiene roles específicos, se asume 'estudiante'


      // Procesar datos del usuario basado en si es institucional o no
      const userData = {
        id: tokenData.sub,
        name: isInstitutional ? tokenData.name : tokenData.preferred_username,
        email: tokenData.email,
        rols: userRoles,
        token: data.access_token,
        isInstitutional
      };


      setUser(userData);
      localStorage.setItem("userData", encryptData(userData));
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
    localStorage.setItem("userData", encryptData(guestUser));
    if (userData.token) {
      localStorage.setItem("jwtToken", encryptData(userData.token));
    }
  };

  // El cierre de sesión solo limpiaba a invitados e institucionales: para el
  // login local no entraba en ninguna rama y la sesión sobrevivía. Además
  // dejaba atrás `userPermissions` y `strapiUserId`.
  const logout = () => {
    setUser(null);
    localStorage.removeItem("userData");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userPermissions");
    localStorage.removeItem("strapiUserId");

    if (keycloak) {
      keycloak.logout();
    }
  };


  /* ========================================================= */

  const login = (userData, token) => {
    // El login local guarda el rol en `rol` (string) y el institucional en
    // `rols` (array). Se normaliza a `rols` porque es lo que consultan
    // ProtectedRoute y el resto de la app.
    const rols = userData.rols ?? (userData.rol ? [userData.rol] : []);
    const normalized = { ...userData, rols };
    setUser({ ...normalized, token });
    localStorage.setItem("userData", encryptData(normalized));
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

AuthProvider.propTypes = {
  children: PropTypes.node,
};