import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { clearStoredSession, getUserData } from "../utils/auth.utils";
import { AUTH_EXPIRED_EVENT } from "../core/apiClient";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("userData")) {
      const userData = getUserData();
      if (userData) {
        // El token no se guarda dentro de userData; sin rehidratarlo aquí, las
        // llamadas que dependen de `user.token` fallan tras recargar la página.
        const token = localStorage.getItem("jwtToken");
        setUser({ ...userData, token: userData.token ?? token });
      } else {
        // Sesión guardada antes de dejar de cifrar (AES) o corrupta: no se
        // puede leer, así que se limpia entera y el usuario vuelve a entrar.
        clearStoredSession();
      }
    }
    setLoading(false);
  }, []);

  // apiClient ya borró localStorage al recibir el 401; aquí solo se descarta
  // el usuario en memoria para que ProtectedRoute redirija al login.
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const loginAsGuest = (userData) => {
    const guestUser = {
      ...userData, isGuest: true, isInstitutional: false, rols: userData.rols || ["estudiante"]
    };
    setUser(guestUser);
    localStorage.setItem("userData", JSON.stringify(guestUser));
    if (userData.token) {
      localStorage.setItem("jwtToken", userData.token);
    }
  };

  // El cierre de sesión solo limpiaba a invitados e institucionales: para el
  // login local no entraba en ninguna rama y la sesión sobrevivía. Además
  // dejaba atrás `userPermissions` y `strapiUserId`.
  const logout = () => {
    setUser(null);
    clearStoredSession();
  };


  /* ========================================================= */

  const login = (userData, token) => {
    // El login local guarda el rol en `rol` (string) y el institucional en
    // `rols` (array). Se normaliza a `rols` porque es lo que consultan
    // ProtectedRoute y el resto de la app.
    const rols = userData.rols ?? (userData.rol ? [userData.rol] : []);
    const normalized = { ...userData, rols };
    setUser({ ...normalized, token });
    localStorage.setItem("userData", JSON.stringify(normalized));
    localStorage.setItem("jwtToken", token);
  };


  return (
    <AuthContext.Provider value={{
      user,
      loginAsGuest,
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